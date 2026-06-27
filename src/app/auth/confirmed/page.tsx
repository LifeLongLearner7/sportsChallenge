"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, RefreshCcw, AlertCircle, Zap } from "lucide-react";

/**
 * /auth/confirmed — Email Confirmation Welcome Interstitial
 *
 * By the time the user reaches this page, the PKCE code has already been
 * exchanged for a session by the server-side /api/auth/callback route handler.
 * This page simply reads the existing session and shows the welcome screen.
 * No code exchange happens here.
 */
export default function ConfirmedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"syncing" | "success" | "error">("syncing");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const checkSession = async () => {
      // Give the session cookie a moment to propagate after the server redirect
      await new Promise((r) => setTimeout(r, 600));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("success");
        return;
      }

      // Fallback: listen for the auth state change event
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
            setStatus("success");
            subscription.unsubscribe();
          }
        }
      );

      // Safety timeout — if no session after 8s, redirect back with error
      const timeout = setTimeout(() => {
        setStatus((prev) => {
          if (prev === "syncing") {
            subscription.unsubscribe();
            setTimeout(() => router.push("/?error=Code_Exchange_Failed#auth"), 2000);
            return "error";
          }
          return prev;
        });
      }, 8000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    };

    checkSession();
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
                  Confirmation link may have expired or already been used.{" "}
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
