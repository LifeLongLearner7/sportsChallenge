"use client";

import { useState } from "react";
import AvatarGallery from "@/components/AvatarGallery";
import { Save, User, Fingerprint, ShieldCheck, Cpu, Flag } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Profile } from "@/types";
import { updateProfile } from "@/lib/data-actions";
import { AVATARS, FACTIONS } from "@/lib/constants";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsClientProps {
  profile: Profile | null;
}

export default function SettingsClient({ profile }: SettingsClientProps) {
  const [screenName, setScreenName] = useState(profile?.screen_name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_url || "neural_ace");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-2">
         <h1 className="font-headline text-3xl font-black text-white uppercase italic tracking-tighter">Neural Settings</h1>
         <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Reconfigure your digital presence in the arena</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Identity Customization */}
        <section className="glass-panel p-8 rounded-3xl border-primary/20 flex flex-col gap-8 border-white/5">
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
                  "w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg",
                  isSaving 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : saveSuccess 
                      ? "bg-green-500/20 text-green-400 border border-green-500/50"
                      : "bg-primary text-white shadow-[0_0_20px_rgba(129,236,255,0.4)] hover:shadow-[0_0_30px_rgba(129,236,255,0.6)] hover:-translate-y-0.5"
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

        {/* Avatar & Faction Selection */}
        <section className="glass-panel p-8 rounded-3xl border-secondary/20 flex flex-col gap-8 border-white/5">
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
      </div>
    </div>
  );
}
