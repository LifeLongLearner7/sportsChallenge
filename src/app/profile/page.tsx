import { User, Shield, Zap, Trophy } from "lucide-react";
import Image from "next/image";
import { getUserProfile, getUserDetailedHistory } from "@/lib/data-actions";
import { AVATARS } from "@/lib/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DossierHistory from "@/components/DossierHistory";

import { Suspense } from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default async function ProfilePage() {
  const profile = await getUserProfile();
  
  if (!profile) return null;
  
  // Find the selected avatar icon
  const selectedAvatar = AVATARS.find(a => a.id === profile?.avatar_url) || AVATARS[0];
  const AvatarIcon = selectedAvatar.icon;

  // Calculate dynamic stats
  const matchesPredicted = profile?.matches_predicted || 0;
  const points = profile?.points || 0;
  const accuracy = profile?.accuracy || 0;
  
  const level = Math.floor(points / 10) + 1;
  const pulse = matchesPredicted > 50 ? "OVERDRIVE" : 
                matchesPredicted > 20 ? "HIGH" : 
                matchesPredicted > 5 ? "STABLE" : "CALIBRATING";
  
  const tier = points > 100 ? "GRANDMASTER" :
               points > 50 ? "EXPERT" :
               points > 20 ? "ELITE" : "INITIATE";

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col md:flex-row items-center gap-8 glass-panel p-8 rounded-3xl border-primary/20">
        <div className="w-32 h-32 bg-surface-container-highest rounded-full border-4 border-primary/20 p-1 flex items-center justify-center hex-clip overflow-hidden relative">
           <div className={cn("w-full h-full flex items-center justify-center relative z-10", !selectedAvatar.path && selectedAvatar.bg)}>
             {selectedAvatar.path ? (
                <Image src={selectedAvatar.path} fill sizes="128px" className="object-cover" alt="User" />
             ) : selectedAvatar.icon ? (
                (() => {
                  const Icon = selectedAvatar.icon;
                  return <Icon size={64} className={selectedAvatar.color} />;
                })()
             ) : null}
           </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="font-headline text-4xl font-black text-white uppercase italic tracking-tighter">
            {profile?.screen_name || "New Strategist"}
          </h1>
          <p className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Elite Neural Strategist</p>
          <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
             <span className="px-4 py-1.5 bg-secondary/10 border border-secondary/30 rounded-full text-[10px] font-black text-secondary uppercase italic">Level {level}</span>
             <span className="px-4 py-1.5 bg-tertiary/10 border border-tertiary/30 rounded-full text-[10px] font-black text-tertiary uppercase italic">{tier} Tier</span>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-3">
          <Shield className="text-primary" size={24} />
          <div className="text-[10px] font-black text-slate-500 uppercase">Neural Integrity</div>
          <div className="text-2xl font-headline font-black text-white italic">{accuracy.toFixed(1)}%</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-3">
          <Zap className="text-secondary" size={24} />
          <div className="text-[10px] font-black text-slate-500 uppercase">Prediction Pulse</div>
          <div className="text-2xl font-headline font-black text-white italic">{pulse}</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-3">
          <Trophy className="text-tertiary" size={24} />
          <div className="text-[10px] font-black text-slate-500 uppercase">Arena Trophies</div>
          <div className="text-2xl font-headline font-black text-white italic">{points}</div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-black text-white uppercase italic">Strategic Dossier</h2>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Neural Link Sync: Active</span>
            </div>
         </div>
         
         <Suspense fallback={
            <div className="h-[200px] w-full bg-black/40 rounded-xl border border-white/5 flex items-center justify-center">
               <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest animate-pulse">History visualization loading...</span>
            </div>
         }>
            <DossierHistory userId={profile.id} limit={10} />
         </Suspense>
      </div>
    </div>
  );
}
