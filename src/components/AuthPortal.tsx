"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-actions";
import { ArrowRight, Lock, Mail, UserPlus, LogIn, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function AuthForm({ mode, setMode, loading, setLoading }: any) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <div className="flex flex-col gap-6 relative z-10 font-sans">
      <div className="text-center">
        <h2 className="font-headline text-3xl font-black uppercase tracking-tight italic text-white flex items-center justify-center gap-3">
          {mode === "signIn" ? <LogIn className="text-primary" /> : <UserPlus className="text-secondary" />}
          {mode === "signIn" ? "Access Portal" : "Neural Link"}
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">
          {mode === "signIn" ? "Identify yourself for arena entry" : "Initialize your digital signature"}
        </p>
      </div>

      {/* Tactical Alerts */}
      {(error || message) && (
        <div className={cn(
          "p-3 rounded border text-xs font-bold uppercase tracking-wider flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300",
          error ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-primary/10 border-primary/50 text-primary"
        )}>
          {error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span className="flex-1">{error || message}</span>
        </div>
      )}

      <form action={mode === "signIn" ? signIn : signUp} onSubmit={() => setLoading(true)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <div className="relative group">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 mb-2 block">Tactical ID (Email)</label>
             <div className="relative">
                <input 
                  name="email"
                  required
                  className="w-full bg-black/40 border-b-2 border-white/5 focus:border-primary focus:ring-0 text-white placeholder:text-slate-700 font-bold transition-all py-3 pl-10 outline-none" 
                  placeholder="strategist@arena.com" 
                  type="email"
                />
                <Mail className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors" size={16} />
             </div>
          </div>

          <div className="relative group">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 mb-2 block">Security Key</label>
             <div className="relative">
                <input 
                  name="password"
                  required
                  className="w-full bg-black/40 border-b-2 border-white/5 focus:border-secondary focus:ring-0 text-white placeholder:text-slate-700 font-bold transition-all py-3 pl-10 outline-none" 
                  placeholder="••••••••" 
                  type="password"
                />
                <Lock className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-secondary transition-colors" size={16} />
             </div>
          </div>
        </div>

        <button 
          disabled={loading}
          className={cn(
            "w-full py-4 mt-2 font-headline font-bold uppercase tracking-[0.3em] text-xs rounded transition-all flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-50",
            mode === "signIn" 
              ? "bg-surface-container-highest border border-primary/20 text-white hover:bg-primary/10 hover:border-primary shadow-[0_0_15px_rgba(129,236,255,0.1)]" 
              : "bg-surface-container-highest border border-secondary/20 text-white hover:bg-secondary/10 hover:border-secondary shadow-[0_0_15px_rgba(255,107,152,0.1)]"
          )} 
          type="submit"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              {mode === "signIn" ? "Initialize Login" : "Establish Link"}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="flex flex-col gap-4">
         {/* Public Sign Up Disabled - Strategist enrollment now handled by Admin Command Center */}
         {/* 
         <button 
          onClick={() => {
            setMode(mode === "signIn" ? "signUp" : "signIn");
            // Clear signals on mode switch
            window.history.replaceState({}, '', '/');
          }}
          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 group"
         >
           {mode === "signIn" ? "New Strategist? Access Neural Link" : "Already Linked? Return to Portal"}
           <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
         </button>
         */}

         <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-700">
            <span className="bg-[#0a0e14] px-4">Encryption Layer: ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPortal() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [loading, setLoading] = useState(false);

  return (
    <div id="auth" className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-20 border-white/5 overflow-hidden group">
      {/* Decorative Aura */}
      <div className={cn(
        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] transition-colors duration-700",
        mode === "signIn" ? "bg-primary/20" : "bg-secondary/20"
      )}></div>

      <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>}>
        <AuthForm mode={mode} setMode={setMode} loading={loading} setLoading={setLoading} />
      </Suspense>
    </div>
  );
}
