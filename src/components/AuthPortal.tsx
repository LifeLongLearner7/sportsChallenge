"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-actions";
import {
  ArrowRight, Lock, Mail, UserPlus, LogIn, ChevronRight,
  AlertCircle, CheckCircle2, X, ShieldCheck, Eye, EyeOff
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PORTAL_PROTOCOLS = {
  privacy: {
    title: "PRIVACY PROTOCOL",
    content:
      "We treat your tactical data with high-altitude 256-bit isolation. No Personally Identifiable Information (PII) is shared with Mr. Predicto's neural network. Your engagement metrics and prediction history are used strictly to recalibrate the Arena Meta and improve the Global Accuracy Index. All strategic dossiers are encrypted at rest.",
  },
  terms: {
    title: "TERMS OF ENGAGEMENT",
    content:
      "By entering the Cyber-Sports arena, you acknowledge that all predictions and analysis are for strategic engagement and entertainment purposes only. Cyber-Sports is a non-monetary competition designed for master-strategists. We do not support gambling. Misuse of the arena protocols or attempting to inject unauthorized logic into the scoring engine will result in immediate disqualification of your strategist identity.",
  },
};

// ── Password complexity checker ───────────────────────────────────────────────
function checkComplexity(password: string) {
  return {
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasNumberOrSymbol: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const rules = checkComplexity(password);
  if (!password) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-2 px-1 animate-in fade-in duration-200">
      {[
        { label: "6+ characters", ok: rules.minLength },
        { label: "One uppercase letter (A–Z)", ok: rules.hasUppercase },
        { label: "One number or symbol", ok: rules.hasNumberOrSymbol },
      ].map(({ label, ok }) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300",
              ok ? "bg-primary shadow-[0_0_6px_rgba(0,229,255,0.6)]" : "bg-white/10"
            )}
          />
          <span
            className={cn(
              "text-[9px] font-bold uppercase tracking-widest transition-colors duration-300",
              ok ? "text-primary" : "text-slate-600"
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Terms Checkbox ─────────────────────────────────────────────────────────────
function TermsCheckbox({
  checked,
  onChange,
  onOpenPrivacy,
  onOpenTerms,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group select-none">
      {/* Hidden native checkbox for form accessibility / submit blocking */}
      <input
        type="checkbox"
        name="terms_accepted"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {/* Custom checkbox UI — no onClick here; the wrapping <label> handles the toggle */}
      <div
        className={cn(
          "mt-0.5 w-4 h-4 flex-shrink-0 rounded border transition-all duration-200 flex items-center justify-center pointer-events-none",
          checked
            ? "bg-primary border-primary shadow-[0_0_8px_rgba(0,229,255,0.5)]"
            : "border-white/20 bg-black/40 group-hover:border-primary/50"
        )}
      >
        {checked && <ShieldCheck size={10} className="text-black" strokeWidth={3} />}
      </div>
      <span className="text-[10px] font-bold leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors">
        I agree to the{" "}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenTerms(); }}
          className="text-primary hover:underline underline-offset-2"
        >
          Terms of Engagement
        </button>{" "}
        and{" "}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenPrivacy(); }}
          className="text-primary hover:underline underline-offset-2"
        >
          Privacy Protocol
        </button>
        . I understand this is a non-monetary arena.
      </span>
    </label>
  );
}

// ── Main Auth Form ─────────────────────────────────────────────────────────────
function AuthForm({
  mode,
  setMode,
  loading,
  setLoading,
  setActivePortalModal,
}: {
  mode: "signIn" | "signUp";
  setMode: (m: "signIn" | "signUp") => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  setActivePortalModal: (m: null | "privacy" | "terms") => void;
}) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isSignUp = mode === "signUp";
  const complexity = checkComplexity(password);
  const passwordOk =
    complexity.minLength && complexity.hasUppercase && complexity.hasNumberOrSymbol;

  function handleModeSwitch() {
    setMode(mode === "signIn" ? "signUp" : "signIn");
    setPassword("");
    setTermsAccepted(false);
    // Clear URL signals on mode switch
    window.history.replaceState({}, "", "/");
  }

  return (
    <div className="flex flex-col gap-6 relative z-10 font-sans">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-headline text-3xl font-black uppercase tracking-tight italic text-white flex items-center justify-center gap-3">
          {isSignUp ? (
            <UserPlus className="text-secondary" />
          ) : (
            <LogIn className="text-primary" />
          )}
          {isSignUp ? "Neural Link" : "Access Portal"}
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">
          {isSignUp
            ? "Initialize your digital signature"
            : "Identify yourself for arena entry"}
        </p>
      </div>

      {/* Tactical Alerts */}
      {(error || message) && (
        <div
          className={cn(
            "p-3 rounded border text-xs font-bold uppercase tracking-wider flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300",
            error
              ? "bg-red-500/10 border-red-500/50 text-red-400"
              : "bg-primary/10 border-primary/50 text-primary"
          )}
        >
          {error ? (
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
          )}
          <span className="flex-1 normal-case tracking-normal leading-relaxed font-semibold">
            {error === "Code_Exchange_Failed"
              ? "Tactical Handshake Failed. Your invitation link may have expired or the security environment is mismatched."
              : error || message}
          </span>
        </div>
      )}

      <form
        action={isSignUp ? signUp : signIn}
        onSubmit={() => setLoading(true)}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-4">
          {/* Email */}
          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 mb-2 block">
              Tactical ID (Email)
            </label>
            <div className="relative">
              <input
                name="email"
                required
                className="w-full bg-black/40 border-b-2 border-white/5 focus:border-primary focus:ring-0 text-white placeholder:text-slate-700 font-bold transition-all py-3 pl-10 outline-none"
                placeholder="strategist@arena.com"
                type="email"
              />
              <Mail
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors"
                size={16}
              />
            </div>
          </div>

          {/* Password */}
          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 mb-2 block">
              Security Key
            </label>
            <div className="relative">
              <input
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border-b-2 border-white/5 focus:border-secondary focus:ring-0 text-white placeholder:text-slate-700 font-bold transition-all py-3 pl-10 pr-10 outline-none"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
              />
              <Lock
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-secondary transition-colors"
                size={16}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Live complexity indicator — only on sign-up */}
            {isSignUp && <PasswordStrengthIndicator password={password} />}
          </div>
        </div>

        {/* Terms checkbox — sign-up only */}
        {isSignUp && (
          <TermsCheckbox
            checked={termsAccepted}
            onChange={setTermsAccepted}
            onOpenPrivacy={() => setActivePortalModal("privacy")}
            onOpenTerms={() => setActivePortalModal("terms")}
          />
        )}

        {/* Submit */}
        <button
          disabled={loading || (isSignUp && (!passwordOk || !termsAccepted))}
          className={cn(
            "w-full py-4 mt-2 font-headline font-bold uppercase tracking-[0.3em] text-xs rounded transition-all flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
            isSignUp
              ? "bg-surface-container-highest border border-secondary/20 text-white hover:bg-secondary/10 hover:border-secondary shadow-[0_0_15px_rgba(255,107,152,0.1)]"
              : "bg-surface-container-highest border border-primary/20 text-white hover:bg-primary/10 hover:border-primary shadow-[0_0_15px_rgba(129,236,255,0.1)]"
          )}
          type="submit"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {isSignUp ? "Establish Link" : "Initialize Login"}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </>
          )}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {/* Mode toggle */}
        <button
          onClick={handleModeSwitch}
          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 group"
        >
          {isSignUp
            ? "Already linked? Return to Portal"
            : "New Strategist? Access Neural Link"}
          <ChevronRight
            size={12}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-700">
            <span className="bg-[#0a0e14] px-4">Encryption Layer: ACTIVE</span>
          </div>
        </div>

        {/* Legal Links */}
        <div className="flex gap-4 justify-center text-[9px] uppercase font-black tracking-widest">
          <button
            type="button"
            onClick={() => setActivePortalModal("privacy")}
            className="text-slate-600 hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/50"
          >
            Privacy Protocol
          </button>
          <span className="text-slate-800">/</span>
          <button
            type="button"
            onClick={() => setActivePortalModal("terms")}
            className="text-slate-600 hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/50"
          >
            Terms of Engagement
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Portal Root ────────────────────────────────────────────────────────────────
export default function AuthPortal() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [loading, setLoading] = useState(false);
  const [activePortalModal, setActivePortalModal] = useState<
    null | "privacy" | "terms"
  >(null);

  return (
    <>
      <div
        id="auth"
        className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-20 border-white/5 overflow-hidden group"
      >
        {/* Decorative Aura */}
        <div
          className={cn(
            "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] transition-colors duration-700",
            mode === "signIn" ? "bg-primary/20" : "bg-secondary/20"
          )}
        />

        <Suspense
          fallback={
            <div className="h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          }
        >
          <AuthForm
            mode={mode}
            setMode={setMode}
            loading={loading}
            setLoading={setLoading}
            setActivePortalModal={setActivePortalModal}
          />
        </Suspense>
      </div>

      {/* Legal Modal Overlay */}
      {activePortalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setActivePortalModal(null)}
          />
          <div className="relative w-full max-w-lg p-8 glass-panel border border-primary/30 rounded-2xl shadow-[0_0_50px_rgba(129,236,255,0.15)] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h2 className="font-headline font-black text-xl italic tracking-tighter text-white">
                SYSTEM{" "}
                <span className="text-primary">
                  {PORTAL_PROTOCOLS[activePortalModal].title}
                </span>
              </h2>
              <button
                onClick={() => setActivePortalModal(null)}
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              {PORTAL_PROTOCOLS[activePortalModal].content}
            </p>
            <button
              onClick={() => setActivePortalModal(null)}
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
