"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { RefreshCcw, ShieldCheck, AlertCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"syncing" | "success" | "error">("syncing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Check for Fragment-based tokens (#access_token=...)
        // This is common in the Implicit Flow
        if (window.location.hash) {
          console.log("HANDSHAKE: Fragment detected. Parsing tactical tokens...");
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            console.log("HANDSHAKE: Manual session synchronization initiated.");
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
            
            setStatus("success");
            setTimeout(() => router.push("/profile/settings"), 1500);
            return;
          }
        }

        // 2. Check for PKCE Code in query params (?code=...)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get("code");

        if (code) {
          console.log("HANDSHAKE: Exchanging PKCE code...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          
          setStatus("success");
          setTimeout(() => router.push("/profile/settings"), 1500);
          return;
        }

        // 3. Last Resort: Listen for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session) {
          console.log("HANDSHAKE: Immediate session detected.");
          setStatus("success");
          setTimeout(() => router.push("/profile/settings"), 1500);
          return;
        }

        // Keep syncing state visible while waiting if nothing is found yet
        console.log("HANDSHAKE: No immediate tokens found. Monitoring registry pulse...");
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("HANDSHAKE EVENT:", event);
          if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
            setStatus("success");
            subscription.unsubscribe();
            setTimeout(() => router.push("/profile/settings"), 1500);
          }
        });

        // Safety timeout (15s for high-latency handshakes)
        setTimeout(() => {
          if (status === "syncing") {
            setStatus("error");
            setErrorMsg("Identity Handshake Timeout");
          }
        }, 15000);
      } catch (err: any) {
        console.error("HYBRID_BRIDGE_ERROR:", err.message);
        setStatus("error");
        setErrorMsg(err.message);
        
        // Redirect back to landing with error signal after a delay
        setTimeout(() => {
          router.push("/?error=Code_Exchange_Failed#auth");
        }, 3000);
      }
    };

    handleCallback();
  }, [router, status]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(129,236,255,0.05)_0%,transparent_100%)]">
      <div className="glass-panel max-w-sm w-full p-8 rounded-3xl border-white/5 text-center relative overflow-hidden">
        {/* Decorative Aura */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] transition-colors duration-1000 ${
          status === "error" ? "bg-red-500/10" : "bg-primary/10"
        }`}></div>

        <div className="relative z-10">
          <div className="mb-6 flex justify-center">
            {status === "syncing" && (
              <div className="relative">
                <RefreshCcw className="text-primary animate-spin" size={48} />
                <div className="absolute inset-0 blur-lg bg-primary/20 animate-pulse"></div>
              </div>
            )}
            {status === "success" && (
              <div className="relative">
                <ShieldCheck className="text-primary animate-in zoom-in duration-500" size={48} />
                <div className="absolute inset-0 blur-lg bg-primary/40"></div>
              </div>
            )}
            {status === "error" && (
              <AlertCircle className="text-red-500 animate-in shake duration-500" size={48} />
            )}
          </div>

          <h2 className="font-headline text-2xl font-black uppercase italic tracking-tighter text-white mb-2">
            {status === "syncing" && "Synchronizing Identity"}
            {status === "success" && "Handshake Complete"}
            {status === "error" && "Link Connection Failed"}
          </h2>
          
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8">
            {status === "syncing" && "Establishing Neural Connection with Auth Registry"}
            {status === "success" && "Identity Verified. Redirecting to Profile Settings"}
            {status === "error" && (errorMsg || "Security environments are mismatched")}
          </p>

          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${
              status === "error" ? "bg-red-500 w-full" : "bg-primary animate-progress"
            }`}></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s linear infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
