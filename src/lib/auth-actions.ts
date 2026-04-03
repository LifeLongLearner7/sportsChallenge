"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * SECURITY PROTOCOL: Administrative Clearance Verification (v5.0.2)
 * Ensures the current strategist has verified 'is_admin' status.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: Neural clearance required.");
  
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) throw new Error("Forbidden: Strategic Level 5 Clearance required.");
  return user;
}

/**
 * Creates a stateless Supabase client that does not use cookies.
 * Used for admin actions where we want to create a user without logging them in
 * and without affecting the current admin's session.
 */
export async function createServiceClient() {
  /**
   * Service-role client: bypasses ALL Supabase RLS policies.
   * Use ONLY in server-side contexts with no user session:
   *   - Vercel cron routes (/api/cron/*)
   *   - Admin operations that need to write to any table
   *
   * NEVER expose this client or key to the browser.
   */
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error) {
    return redirect(`/?error=${encodeURIComponent(error.message)}#auth`);
  }

  // If Supabase is configured to require email confirmation, session will be null
  if (data?.user && !data?.session) {
    return redirect(`/?message=${encodeURIComponent("Tactical link sent! Check your inbox to finalize connection.")}#auth`);
  }

  return redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/?error=${encodeURIComponent(error.message)}#auth`);
  }

  return redirect("/dashboard");
}

export async function adminSignUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const adminClient = await createServiceClient();

  // Create user using the stateless admin client
  const { data, error } = await adminClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: data.session ? "Strategist synchronized successfully." : "Tactical link sent to strategist inbox." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
}

/**
 * SELF-SERVICE PASSWORD ROTATION (v4.3)
 * Allows the current strategist to update their encryption signature.
 */
export async function updateOwnPassword(password: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.updateUser({
    password: password,
    data: { onboarding_completed: true }
  });

  if (error) {
    return { error: error.message };
  }

  // Finalize identity in profile registry via Master Override (Service Role)
  if (data.user) {
    const adminClient = await createServiceClient();
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", data.user.id);
    
    if (profileError) {
      console.error("Neural Firewall: Failed to finalize identity:", profileError.message);
      return { error: "Identity core synchronization failed. Contact Admin." };
    }
  }

  revalidatePath("/profile/settings");
  return { success: true };
}

/**
 * ADMINISTRATIVE MASTER OVERRIDE (v4.3)
 * Uses the service-role protocol to reset any strategist's encryption.
 * Targets by email via the Master Auth Registry.
 */
export async function adminResetUserPassword(email: string, password: string) {
  // SECURITY FORTIFICATION (V-05): Administrative Gate
  await requireAdmin();
  const adminClient = await createServiceClient();
  
  // 1. Resolve Target Identity via Master Auth Registry
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
  
  if (listError) {
    return { error: "Registry Connection Severed: " + listError.message };
  }

  const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!targetUser) {
    return { error: "Tactical ID not found in Master Auth Registry." };
  }

  // 2. Execute Master Override
  const { data, error } = await adminClient.auth.admin.updateUserById(
    targetUser.id,
    { password: password }
  );

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: `Encryption signature reset for ${email}.` };
}

/**
 * STRATEGIC RECRUITMENT (v4.4)
 * Dispatches a native Supabase invitation link to a new strategist.
 * Redirects them directly to their Identity Core upon arrival.
 */
export async function inviteStrategist(email: string) {
  // SECURITY FORTIFICATION (V-05): Administrative Gate
  await requireAdmin();
  const adminClient = await createServiceClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: `Neural invitation dispatched to ${email}.` };
}
