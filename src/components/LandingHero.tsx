"use client";

import { useState } from "react";
import { Zap, Users, ArrowRight, Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signUp } from "@/lib/auth-actions";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LandingHeroProps {
  stats: {
    humanScore: string;
    aiScore: string;
    globalAccuracy: string;
  };
}

// ── Shared protocol content (mirrors AuthPortal.tsx) ─────────────────────────
const PORTAL_PROTOCOLS = {
  privacy: {
    title: "PRIVACY PROTOCOL",
    content:
      "We treat your tactical data with high-altitude 256-bit isolation. No Personally Identifiable Information (PII) is shared with Mr. Predicto’s neural network. Your engagement metrics and prediction history are used strictly to recalibrate the Arena Meta and improve the Global Accuracy Index. All strategic dossiers are encrypted at rest.",
  },
  terms: {
    title: "TERMS OF ENGAGEMENT",
    content:
      "By entering the Cyber-Sports arena, you acknowledge that all predictions and analysis are for strategic engagement and entertainment purposes only. Cyber-Sports is a non-monetary competition designed for master-strategists. We do not support gambling. Misuse of the arena protocols or attempting to inject unauthorized logic into the scoring engine will result in immediate disqualification of your strategist identity.",
  },
};

// ── Password complexity (mirrors auth-actions.ts) ─────────────────────────────
function checkComplexity(pw: string) {
  return {
    minLength: pw.length >= 6,
    hasUppercase: /[A-Z]/.test(pw),
    hasNumberOrSymbol: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };
}

// ── Inline Sign-Up Panel ───────────────────────────────────────────────────────
function ArenaSignUpPanel({
  onClose,
  onOpenModal,
}: {
  onClose: () => void;
  onOpenModal: (m: "privacy" | "terms") => void;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const complexity = checkComplexity(password);
  const passwordOk = complexity.minLength && complexity.hasUppercase && complexity.hasNumberOrSymbol;
  const canSubmit = passwordOk && termsAccepted && !loading;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    const formData = new FormData(e.currentTarget);

    try {
      // signUp is a server action — call it directly
      await signUp(formData);
      // If signUp redirects, this won't run; if it doesn't redirect (e.g. error path),
      // we catch the redirect error thrown by Next.js.
    } catch (err: any) {
      // Next.js server action redirects throw a special NEXT_REDIRECT error
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        const url = err.digest.split(";")[2] || "/";
        if (url.includes("message=")) {
          // Success — email sent
          setStatus("success");
        } else if (url.includes("error=")) {
          const msg = decodeURIComponent(url.split("error=")[1]?.split("#")[0] || "Registration failed.");
          setStatus("error");
          setErrorMsg(msg);
        }
      } else {
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: 8, height: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="glass-panel rounded-2xl border border-primary/20 bg-white/[0.03] shadow-[0_0_40px_rgba(0,229,255,0.06)] relative">
        {/* Top accent line */}
        <div className="h-px w-full bg-gradient-to-r from-primary/60 via-primary/20 to-transparent rounded-t-2xl" />

        <div className="p-6 flex flex-col gap-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Users size={13} className="text-primary" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                  Free · No credit card
                </p>
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                  Create Your Strategist Identity
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-700 hover:text-slate-400 transition-colors"
              aria-label="Close sign-up panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Success state */}
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                <CheckCircle2 size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-white font-black text-sm uppercase tracking-widest">
                  Tactical Link Dispatched!
                </p>
                <p className="text-slate-500 text-[11px] font-medium mt-1 leading-relaxed">
                  Check your inbox and click the link to activate your Arena identity.
                </p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          {status !== "success" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Error alert */}
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-400 font-semibold leading-relaxed">
                    {errorMsg}
                  </p>
                </motion.div>
              )}

              {/* Email */}
              <div className="relative group">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 mb-1.5 block">
                  Tactical ID (Email)
                </label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="strategist@arena.com"
                    className="w-full bg-black/40 border border-white/5 focus:border-primary/50 rounded-lg text-white placeholder:text-slate-700 text-xs font-bold transition-all py-2.5 pl-9 pr-3 outline-none focus:bg-black/60"
                  />
                  <Mail
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="relative group">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 mb-1.5 block">
                  Security Key
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars, uppercase + number"
                    className="w-full bg-black/40 border border-white/5 focus:border-secondary/50 rounded-lg text-white placeholder:text-slate-700 text-xs font-bold transition-all py-2.5 pl-9 pr-9 outline-none focus:bg-black/60"
                  />
                  <Lock
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-secondary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>

                {/* Mini complexity dots */}
                {password.length > 0 && (
                  <div className="flex gap-3 mt-2 px-1">
                    {[
                      { label: "6+ chars", ok: complexity.minLength },
                      { label: "Uppercase", ok: complexity.hasUppercase },
                      { label: "Number/Symbol", ok: complexity.hasNumberOrSymbol },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-1">
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            ok
                              ? "bg-primary shadow-[0_0_4px_rgba(0,229,255,0.8)]"
                              : "bg-white/10"
                          )}
                        />
                        <span
                          className={cn(
                            "text-[8px] font-bold uppercase tracking-wider transition-colors",
                            ok ? "text-primary" : "text-slate-700"
                          )}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  name="terms_accepted"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="sr-only"
                />
                {/* pointer-events-none: the wrapping <label> handles the toggle */}
                <div
                  className={cn(
                    "mt-0.5 w-3.5 h-3.5 flex-shrink-0 rounded border transition-all duration-200 flex items-center justify-center pointer-events-none",
                    termsAccepted
                      ? "bg-primary border-primary shadow-[0_0_6px_rgba(0,229,255,0.4)]"
                      : "border-white/15 bg-black/40 group-hover:border-primary/40"
                  )}
                >
                  {termsAccepted && (
                    <ShieldCheck size={8} className="text-black" strokeWidth={3} />
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-600 leading-relaxed group-hover:text-slate-500 transition-colors">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenModal("terms"); }}
                    className="text-primary hover:underline underline-offset-2"
                  >
                    Terms of Engagement
                  </button>{" "}
                  &{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenModal("privacy"); }}
                    className="text-primary hover:underline underline-offset-2"
                  >
                    Privacy Protocol
                  </button>
                  . Non-monetary arena.
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "w-full py-3 rounded-lg font-headline font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 group transition-all",
                  canSubmit
                    ? "bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/40 text-primary hover:from-primary/30 hover:border-primary/60 shadow-[0_0_15px_rgba(0,229,255,0.1)] hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]"
                    : "bg-white/[0.02] border border-white/5 text-slate-700 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={13} />
                    Establish Neural Link
                    <ArrowRight
                      size={13}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </>
                )}
              </button>

              <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-700">
                Already linked?{" "}
                <a href="#auth" className="text-slate-500 hover:text-primary transition-colors">
                  Sign in →
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Hero ──────────────────────────────────────────────────────────────────
export default function LandingHero({ stats }: LandingHeroProps) {
  const [showSignUp, setShowSignUp] = useState(false);
  const [activeModal, setActiveModal] = useState<null | "privacy" | "terms">(null);

  return (
    <>
    <div className="flex flex-col gap-10 relative">

      {/* Proposition Pulse */}
      <div className="flex flex-col gap-5">
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 bg-secondary/15 border border-secondary/30 text-secondary px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.4em] uppercase w-fit"
        >
          <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#ff6b98] animate-pulse" />
          Live: Human vs AI Epoch 1
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-headline text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase italic"
        >
          Join the <br />
          <span className="text-primary italic">Synthetic</span> <br />
          <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">Arena</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-md text-slate-400 text-lg md:text-xl leading-relaxed font-medium"
        >
          Experience the high-velocity fusion of T20 energy and futuristic AI precision. Predict outcomes, master the meta, and claim your status.
        </motion.p>
      </div>

      {/* Action Pulse */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-5 items-center">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: showSignUp ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSignUp(!showSignUp)}
            className={cn(
              "px-10 py-5 font-headline font-black uppercase tracking-widest text-sm rounded shadow-[0_0_30px_rgba(129,236,255,0.3)] transition-all",
              showSignUp
                ? "bg-white/5 border border-primary/30 text-primary hover:bg-primary/10"
                : "bg-gradient-to-br from-primary to-primary-dim text-slate-950 hover:shadow-[0_0_40px_rgba(129,236,255,0.5)]"
            )}
          >
            {showSignUp ? "✕ Close" : "Join the Arena"}
          </motion.button>

          <div className="flex -space-x-4 items-center">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-12 h-12 bg-slate-900 rounded-full border-2 border-[#050505] flex items-center justify-center text-primary text-[11px] font-black shadow-2xl"
              >
                U{i}
              </div>
            ))}
            <div className="w-12 h-12 bg-slate-800 rounded-full border-2 border-[#050505] flex items-center justify-center text-[10px] font-black text-primary bg-primary/20 z-10 shadow-2xl">
              12K+
            </div>
          </div>
        </div>

        {/* Expandable inline sign-up panel */}
        <AnimatePresence>
          {showSignUp && (
            <ArenaSignUpPanel
              onClose={() => setShowSignUp(false)}
              onOpenModal={setActiveModal}
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-3">
          <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-1">
            Global Connectivity Confirmed • Thousands signaling...
          </span>
        </div>
      </div>
    </div>

      {/* Protocol Modal Overlay — shared with ArenaSignUpPanel */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          />
          <div className="relative w-full max-w-lg p-8 glass-panel border border-primary/30 rounded-2xl shadow-[0_0_50px_rgba(129,236,255,0.15)] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h2 className="font-headline font-black text-xl italic tracking-tighter text-white">
                SYSTEM{" "}
                <span className="text-primary">{PORTAL_PROTOCOLS[activeModal].title}</span>
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              {PORTAL_PROTOCOLS[activeModal].content}
            </p>
            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full py-3 bg-primary/10 border border-primary/30 text-primary font-black uppercase text-xs tracking-widest hover:bg-primary/20 transition-all rounded"
            >
              Protocol Acknowledged
            </button>
          </div>
        </div>
      )}
    </>
  );
}
