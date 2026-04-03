import { createClient } from "@/lib/auth-actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") || "invite";
  // Default to profile/settings for invitation arrivals if next is missing
  const next = searchParams.get("next") ?? "/profile/settings";

  // Log all tactical params for debugging
  console.log("HANDSHAKE RECEIVED [callback]:", Array.from(searchParams.keys()));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
       return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("HANDSHAKE FAILURE [code_exchange]:", error.message);
  }

  if (token_hash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("HANDSHAKE FAILURE [token_verify]:", error.message);
  }

  // return the user to the landing page with auth error instructions
  return NextResponse.redirect(`${origin}/?error=Code_Exchange_Failed#auth`);
}
