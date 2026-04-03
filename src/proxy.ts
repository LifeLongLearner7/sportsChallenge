import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * PROXY (Next.js Edge) — Multi-Layer Security Guard
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

const PROTECTED_ROUTES = ["/dashboard", "/arena", "/leaderboard", "/profile"];
const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTE = "/";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
    const isAuthCallback = pathname.startsWith("/auth/callback");

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
