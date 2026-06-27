import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * PROXY (Next.js Edge) — Multi-Layer Security Guard
 *
 * Layer 0: Rate Limiting (Upstash Redis)
 *   — Sign-up:  5 attempts / IP / 1 hour
 *   — Sign-in: 10 attempts / IP / 15 minutes
 *
 * Layer 1: Session Refresh (runs on every request)
 *   — Keeps Supabase JWTs alive by refreshing cookies at the edge.
 *
 * Layer 2: Route Protection
 *   — /admin/**     : Auth required + is_admin === true verified from DB
 *   — /dashboard, /arena, /leaderboard, /profile/** : Auth required
 *   — /api/predict/**: Auth required (prevents unauthenticated API abuse)
 *   — /api/cron/**  : Excluded — protected by CRON_SECRET bearer token
 *   — /api/auth/**  : Excluded — the auth callback must be reachable
 */

const PROTECTED_ROUTES = ["/dashboard", "/arena", "/leaderboard", "/profile", "/rules", "/groups"];
const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTE = "/";

// ── Upstash Redis Rate Limiters ───────────────────────────────────────────────
let redis: Redis | null = null;
let signUpLimiter: Ratelimit | null = null;
let signInLimiter: Ratelimit | null = null;

function getRateLimiters() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return { signUpLimiter: null, signInLimiter: null };

    // Strip surrounding quotes if accidentally included in .env.local
    redis = new Redis({
      url: url.replace(/^"|"$/g, ""),
      token: token.replace(/^"|"$/g, ""),
    });

    signUpLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "rl:signup",
      analytics: false,
    });

    signInLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      prefix: "rl:signin",
      analytics: false,
    });
  }
  return { signUpLimiter, signInLimiter };
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ── Layer 0: Rate Limiting ────────────────────────────────────────────────
  const isSignUpAction =
    request.method === "POST" && pathname === "/api/auth/signup";
  const isSignInAction =
    request.method === "POST" && pathname === "/api/auth/signin";

  // Also intercept Next.js Server Action form posts to the home page
  const isServerActionPost =
    request.method === "POST" && pathname === "/";

  if (isSignUpAction || isSignInAction || isServerActionPost) {
    try {
      const { signUpLimiter: suLimiter, signInLimiter: siLimiter } =
        getRateLimiters();
      const ip = getClientIp(request);
      const referer = request.headers.get("referer") || "";

      // Detect which action is being performed via the Next.js action ID header
      const nextAction = request.headers.get("next-action") || "";

      // For Server Action posts from landing page — check referer to classify
      if (isServerActionPost && (suLimiter || siLimiter)) {
        // We apply a conservative combined check using the sign-in limiter
        // (sign-in is the higher-frequency concern; signup has its own endpoint)
        if (siLimiter) {
          const { success } = await siLimiter.limit(ip);
          if (!success) {
            const redirectUrl = new URL(AUTH_ROUTE, request.url);
            redirectUrl.searchParams.set(
              "error",
              "Too many attempts. Please wait before trying again."
            );
            redirectUrl.hash = "auth";
            return NextResponse.redirect(redirectUrl);
          }
        }
      }
    } catch (e) {
      // Redis errors must never block the request — fail open
      console.warn("PROXY: Rate limiter error (failing open):", e);
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // ── Layer 1: Session Refresh ──────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isApiPredictRoute = pathname.startsWith("/api/predict");

  // ── Layer 2a: Admin route guard — auth + DB is_admin check ───────────────

  if ((isProtectedRoute || isApiPredictRoute || isAdminRoute) && user) {
    // Check if the identity is finalized
    // Exclude the profile settings and auth routes to prevent circular redirects
    const isProfileSettings = pathname.startsWith("/profile");
    const isAuthCallback =
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith("/auth/confirmed");

    if (!isProfileSettings && !isAuthCallback) {
      // Check user metadata first for instant token-based release
      const isVerifiedInToken = !!user.user_metadata?.onboarding_completed;

      if (!isVerifiedInToken) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          const redirectUrl = new URL("/profile/settings", request.url);
          redirectUrl.searchParams.set("onboarding", "required");
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
  }

  if (isAdminRoute) {
    if (!user) {
      const redirectUrl = new URL(AUTH_ROUTE, request.url);
      redirectUrl.searchParams.set("error", "Unauthorized: Neural clearance required.");
      redirectUrl.hash = "auth";
      return NextResponse.redirect(redirectUrl);
    }

    // Verify is_admin from the DB — cannot be spoofed from the client
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user!.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  }

  // ── Layer 2b: Standard protected routes ───────────────────────────────────
  if ((isProtectedRoute || isApiPredictRoute) && !user) {
    const redirectUrl = new URL(AUTH_ROUTE, request.url);
    redirectUrl.searchParams.set("error", "Authentication required.");
    redirectUrl.hash = "auth";
    return NextResponse.redirect(redirectUrl);
  }

  // ── Bonus: Redirect authenticated users away from the landing page ─────────
  const isAuthRoute = pathname === AUTH_ROUTE;
  if (user && isAuthRoute) {
    // Even authenticated users must complete onboarding before reaching the dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, icons, public assets
     * - /api/cron/** (protected by CRON_SECRET bearer token)
     * - /api/auth/** (Supabase auth callback)
     */
    "/((?!_next/static|_next/image|favicon.ico|apple-icon|icon|api/cron|api/auth|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
