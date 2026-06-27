"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, RefreshCcw, AlertCircle, Zap } from "lucide-react";

/**
 * /auth/confirmed — Email Confirmation Welcome Interstitial
 *
 * Handles the Supabase confirmation link redirect for self-registered users.
 * Exchanges the PKCE code or session token, then shows a branded welcome screen
 * before redirecting the user to /profile/settings to complete their identity.
 */
export default function ConfirmedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"syncing" | "success" | "error">("syncing");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // 1. Handle fragment-based tokens (#access_token=...) — Implicit Flow
        if (window.location.hash) {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
            setStatus("success");
            return;
          }
        }

        // 2. Handle PKCE code (?code=...) — PKCE Flow (default for email confirmation)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setStatus("success");
          return;
        }

        // 3. Check for an existing session (already exchanged)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus("success");
          return;
        }

        // 4. Listen for auth state changes (fallback for async token delivery)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
              setStatus("success");
              subscription.unsubscribe();
            }
          }
        );

        // Safety timeout
        setTimeout(() => {
          setStatus((prev) => {
            if (prev === "syncing") {
              setErrorMsg("Confirmation link may have expired.");
              return "error";
            }
            return prev;
          });
        }, 15000);
      } catch (err: any) {
        console.error("CONFIRMATION_ERROR:", err.message);
        setStatus("error");
        setErrorMsg(err.message);
        setTimeout(() => router.push("/?error=Code_Exchange_Failed#auth"), 3000);
      }
    };

    handleConfirmation();
  }, [router]);

  // Countdown + redirect on success
  useEffect(() => {
    if (status !== "success") return;
    if (countdown <= 0) {
      router.push("/profile/settings?onboarding=required");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="glass-panel rounded-3xl border border-white/5 p-10 text-center relative overflow-hidden shadow-[0_0_80px_rgba(0,229,255,0.08)]">
          {/* Decorative corner glow */}
          <div
            className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[80px] transition-all duration-1000 ${
              status === "error"
                ? "bg-red-500/15"
                : status === "success"
                ? "bg-primary/25"
                : "bg-primary/10 animate-pulse"
            }`}
          />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-[80px] bg-secondary/10" />

          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Icon */}
            <div className="relative">
              {status === "syncing" && (
                <>
                  <div className="w-20 h-20 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5">
                    <RefreshCcw className="text-primary animate-spin" size={36} />
                  </div>
                  <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
                </>
              )}
              {status === "success" && (
                <>
                  <div className="w-20 h-20 rounded-full border border-primary/30 flex items-center justify-center bg-primary/10 animate-in zoom-in duration-500">
                    <ShieldCheck className="text-primary" size={40} />
                  </div>
                  <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-in fade-in duration-700" />
                </>
              )}
              {status === "error" && (
                <div className="w-20 h-20 rounded-full border border-red-500/30 flex items-center justify-center bg-red-500/10">
                  <AlertCircle className="text-red-400" size={36} />
                </div>
              )}
            </div>

            {/* Status text */}
            {status === "syncing" && (
              <>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">
                    Verifying Neural Signature
                  </p>
                  <h1 className="font-headline text-3xl font-black uppercase italic tracking-tighter text-white">
                    Establishing{" "}
                    <span className="text-primary">Identity</span>
                  </h1>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">
                  Authenticating your confirmation token with the arena registry...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3 animate-in fade-in duration-500">
                    Neural Link Confirmed
                  </p>
                  <h1 className="font-headline text-3xl font-black uppercase italic tracking-tighter text-white animate-in fade-in slide-in-from-bottom-2 duration-500">
                    Welcome to the{" "}
                    <span className="text-primary">Arena</span>
                  </h1>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed font-medium animate-in fade-in duration-700 delay-200">
                  Your identity has been verified and secured. Time to build your strategist profile.
                </p>

                {/* Features teaser */}
                <div className="w-full grid grid-cols-3 gap-2 animate-in fade-in duration-700 delay-300">
                  {[
                    { icon: "⚡", label: "Live Matches" },
                    { icon: "🤖", label: "Beat the AI" },
                    { icon: "🏆", label: "Leaderboard" },
                  ].map(({ icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.03] border border-white/5"
                    >
                      <span className="text-lg">{icon}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Countdown redirect */}
                <div className="w-full animate-in fade-in duration-700 delay-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Redirecting to Profile
                    </span>
                    <span className="text-[10px] font-black text-primary tabular-nums">
                      {countdown}s
                    </span>
                  </div>
                  <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => router.push("/profile/settings?onboarding=required")}
                  className="w-full py-3 bg-primary/10 border border-primary/30 text-primary font-black uppercase text-xs tracking-widest hover:bg-primary/20 transition-all rounded flex items-center justify-center gap-2 group"
                >
                  <Zap size={14} />
                  Enter Arena Now
                </button>
              </>
            )}

            {status === "error" && (
              <>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/70 mb-3">
                    Handshake Failed
                  </p>
                  <h1 className="font-headline text-3xl font-black uppercase italic tracking-tighter text-white">
                    Link <span className="text-red-400">Expired</span>
                  </h1>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">
                  {errorMsg || "Confirmation link may have expired or already been used."}{" "}
                  Redirecting back to the portal...
                </p>
              </>
            )}
          </div>
        </div>

        {/* Bottom wordmark */}
        <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-700 mt-6">
          CYBER-SPORTS · NEURAL ARENA
        </p>
      </div>
    </main>
  );
}
