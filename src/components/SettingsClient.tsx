"use client";

import { useState } from "react";
import AvatarGallery from "@/components/AvatarGallery";
import { Save, User, Fingerprint, ShieldCheck, Cpu, Flag, Lock, ShieldAlert, RefreshCcw } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Profile } from "@/types";
import { updateProfile } from "@/lib/data-actions";
import { updateOwnPassword } from "@/lib/auth-actions";
import { AVATARS, FACTIONS } from "@/lib/constants";
import { useRouter } from "next/navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsClientProps {
  profile: Profile | null;
}

export default function SettingsClient({ profile }: SettingsClientProps) {
  const router = useRouter();
  const isOnboarding = profile && profile.onboarding_completed === false;

  const [screenName, setScreenName] = useState(profile?.screen_name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_url || "neural_ace");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Security State
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");
  
  const [activeTab, setActiveTab] = useState<"persona" | "faction">("persona");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        screen_name: screenName,
        avatar_url: selectedAvatar,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetError("Encryption signature must be at least 6 characters.");
      return;
    }

    setIsResetting(true);
    setResetError("");
    try {
      const result = await updateOwnPassword(newPassword);
      if (result.success) {
        setResetSuccess(true);
        setNewPassword("");
        router.refresh();
        setTimeout(() => setResetSuccess(false), 5000);
      } else {
        setResetError(result.error || "Encryption update failed.");
      }
    } catch (error) {
      setResetError("Neural Link error during rotation.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-2">
         <h1 className="font-headline text-3xl font-black text-white uppercase italic tracking-tighter">Neural Settings</h1>
         <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Reconfigure your digital presence in the arena</p>
      </header>

      {isOnboarding && (
        <div className="glass-panel p-6 rounded-3xl border-red-500/30 bg-red-500/5 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-4 duration-700 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
           <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/30 shrink-0">
             <ShieldAlert size={32} className="animate-pulse" />
           </div>
           <div className="flex-1 text-center md:text-left">
              <h3 className="text-red-400 font-headline font-black uppercase italic tracking-wider">Identity Finalization Protocol Required</h3>
              <p className="text-slate-400 text-sm font-bold mt-1 leading-relaxed">
                Please update password <span className="text-red-400">(Security Protocol)</span> and click on <span className="text-secondary font-black">Revise Encryption</span> button to complete your onboarding.
              </p>
           </div>
           <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-[10px] font-black text-red-500 uppercase italic tracking-widest hidden lg:block">
              Lockdown Active
           </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          {/* Identity Customization - Hidden during onboarding firewall */}
          {!isOnboarding && (
            <section className="glass-panel p-8 rounded-3xl border-primary/20 flex flex-col gap-8 border-white/5 h-fit animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Fingerprint size={20} />
                 </div>
                 <h2 className="text-sm font-black text-white uppercase tracking-wider">Identity Core</h2>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Screen Name</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={screenName}
                    onChange={(e) => setScreenName(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/5 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-primary/50 transition-all placeholder:text-slate-700 font-sans"
                    placeholder="Enter screen name..."
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity">
                    <User size={18} />
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 font-medium px-1 uppercase tracking-tight">THIS IS YOUR PUBLIC IDENTIFIER ACROSS ALL SCREENS.</p>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={14} className="text-secondary" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encryption Grade</span>
                    </div>
                    <span className="text-[10px] font-black text-secondary uppercase italic">Military (AES-256)</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                      "w-full py-4 rounded-xl font-black uppercase tracking-[0.15em] text-[11px] flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg",
                      isSaving 
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                        : saveSuccess 
                          ? "bg-green-500/20 text-green-400 border border-green-500/50"
                          : "bg-primary text-slate-950 font-black shadow-[0_0_20px_rgba(129,236,255,0.4)] hover:bg-white"
                    )}
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : saveSuccess ? (
                      <>IDENTITY UPDATED</>
                    ) : (
                      <>
                        <Save size={18} />
                        Commit Changes
                      </>
                    )}
                  </button>

                  {saveSuccess && (
                    <div className="text-center animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] font-bold text-green-400/70 uppercase tracking-widest italic">
                        the changes will update slowly across all screens
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Security Procedures (v4.3) - ALWAYS VISIBLE */}
          <section className="glass-panel p-8 rounded-3xl border-secondary/20 flex flex-col gap-8 border-white/5 h-fit shadow-xl">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                  <Lock size={20} />
               </div>
               <h2 className="text-sm font-black text-white uppercase tracking-wider">Security Protocol</h2>
            </div>

            <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Secure New Encryption</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/5 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-secondary/50 transition-all placeholder:text-slate-700 font-sans"
                    placeholder="••••••••••••"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary opacity-50 group-focus-within:opacity-100 transition-opacity">
                    <ShieldCheck size={18} />
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 font-medium px-1 uppercase tracking-tight">Minimum 6 characters required for valid identity encryption.</p>
              </div>

              {resetError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                   <ShieldAlert size={14} className="text-red-500" />
                   <span className="text-[10px] font-black text-red-500 uppercase">{resetError}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 mt-2">
                <button 
                  type="submit"
                  disabled={isResetting || !newPassword}
                  className={cn(
                    "w-full py-4 rounded-xl font-black uppercase tracking-[0.15em] text-[11px] flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg font-headline italic",
                    isResetting 
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                      : resetSuccess 
                        ? "bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_20px_#22c55e33]"
                        : "bg-secondary text-white shadow-[0_0_20px_rgba(255,107,152,0.4)] hover:shadow-[0_0_30px_rgba(255,107,152,0.6)] hover:-translate-y-0.5"
                  )}
                >
                  {isResetting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : resetSuccess ? (
                    <>ENCRYPTION ROTATED</>
                  ) : (
                    <>
                      <RefreshCcw size={18} />
                      Revise Encryption
                    </>
                  )}
                </button>

                {resetSuccess && (
                  <div className="text-center animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-bold text-green-400/70 uppercase tracking-widest italic">
                      Your digital signature has been successfully re-encrypted.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </section>
        </div>

        {/* Avatar & Faction Selection - Hidden during onboarding firewall */}
        {!isOnboarding && (
          <section className="glass-panel p-8 rounded-3xl border-secondary/20 flex flex-col gap-8 border-white/5 h-fit animate-in fade-in zoom-in-95 duration-700">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                      <User size={20} />
                  </div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Digital persona</h2>
                </div>
                
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setActiveTab("persona")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                      activeTab === "persona" ? "bg-secondary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    Strategist
                  </button>
                  <button 
                    onClick={() => setActiveTab("faction")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                      activeTab === "faction" ? "bg-secondary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    Faction
                  </button>
                </div>
             </div>

            <div className="min-h-[340px]">
              {activeTab === "persona" ? (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 text-secondary">
                    <Cpu size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Nodes</span>
                  </div>
                  <AvatarGallery 
                    currentId={selectedAvatar} 
                    onSelect={setSelectedAvatar}
                    options={AVATARS}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-2 text-primary">
                    <Flag size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Faction Alignment</span>
                  </div>
                  <AvatarGallery 
                    currentId={selectedAvatar} 
                    onSelect={setSelectedAvatar}
                    options={FACTIONS}
                  />
                </div>
              )}
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
               <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic text-center">Identity synchronization grade</div>
               <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[92%] h-full bg-secondary shadow-[0_0_10px_rgba(255,107,152,0.5)]"></div>
               </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
