"use client";

import { useState } from "react";
import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import { Trophy, TrendingUp, Users, Bot, Zap, Globe } from "lucide-react";
import { Match, Prediction, Profile } from "@/types";
import { submitPrediction } from "@/lib/data-actions";
import Navbar from "@/components/Navbar";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AVATARS } from "@/lib/constants";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardClientProps {
  initialMatches: Match[];
  initialPredictions: Prediction[];
  profile: Profile | null;
  globalStats: {
    userCount: number;
    avgHumanAccuracy: number;
    avgAiAccuracy: number;
  };
}

export default function DashboardClient({ initialMatches, initialPredictions, profile, globalStats }: DashboardClientProps) {
  const [predictions, setPredictions] = useState<Record<string, string>>(
    initialPredictions.reduce((acc, p) => ({ ...acc, [p.match_id]: p.prediction }), {})
  );

  const selectedAvatar = AVATARS.find(a => a.id === profile?.avatar_url) || AVATARS[0];

  const handlePredict = async (matchId: string, winner: string) => {
    try {
      setPredictions((prev) => ({ ...prev, [matchId]: winner }));
      await submitPrediction(matchId, winner);
    } catch (error) {
      console.error("Prediction failed:", error);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedMatches = [...initialMatches].sort((a, b) => 
    new Date(a.match_time).getTime() - new Date(b.match_time).getTime()
  );

  const todayMatches = sortedMatches.filter(match => {
    const matchDate = new Date(match.match_time);
    matchDate.setHours(0, 0, 0, 0);
    return matchDate.getTime() === today.getTime();
  });

  const futureMatches = sortedMatches.filter(match => {
    const matchDate = new Date(match.match_time);
    matchDate.setHours(0, 0, 0, 0);
    return matchDate.getTime() > today.getTime();
  }).slice(0, 2);

  // Stats formatting helpers
  const formatCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const humanLead = globalStats.avgHumanAccuracy - globalStats.avgAiAccuracy;

  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-6">
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      
      <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Profile Summary */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group border-white/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl -mr-12 -mt-12 group-hover:bg-primary/20 transition-all"></div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center hex-clip overflow-hidden transition-all shadow-xl", !selectedAvatar.path && selectedAvatar.bg, selectedAvatar.glow)}>
                 {selectedAvatar.path ? (
                    <img src={selectedAvatar.path} className="w-full h-full object-cover" alt="User" />
                 ) : selectedAvatar.icon ? (
                    (() => {
                      const Icon = selectedAvatar.icon;
                      return <Icon size={24} className={cn("transition-transform", selectedAvatar.color)} />;
                    })()
                 ) : null}
              </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Tactical ID</div>
                  <div className="text-lg font-headline font-black text-white italic uppercase">{profile?.screen_name || "New_Strategist"}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-tight mb-1 font-sans">Season Points</div>
                  <div className="text-xl font-headline font-black text-primary drop-shadow-[0_0_8px_rgba(129,236,255,0.3)]">{profile?.points || 0}</div>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-tight mb-1 font-sans">Accuracy</div>
                  <div className="text-xl font-headline font-black text-secondary drop-shadow-[0_0_8px_rgba(255,107,152,0.3)]">{profile?.accuracy || 0}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 border-white/5 bg-gradient-to-b from-transparent to-primary/5">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" /> Performance Delta
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                  <span className="text-slate-400">Human Sync</span>
                  <span className="text-white">{globalStats.avgHumanAccuracy}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary shadow-[0_0_8px_#81ecff]" style={{ width: `${globalStats.avgHumanAccuracy}%` }}></div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                  <span className="text-secondary/70">AI Core Sync</span>
                  <span className="text-secondary">{globalStats.avgAiAccuracy}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary shadow-[0_0_8px_#ff6b98]" style={{ width: `${globalStats.avgAiAccuracy}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Match Feed */}
        <div className="lg:col-span-6 flex flex-col gap-8">
          <div className="flex justify-between items-end border-b border-white/5 pb-6">
             <div>
               <h1 className="font-headline text-5xl font-black text-white uppercase italic tracking-tighter">
                 Operational <span className="text-primary">Zones</span>
               </h1>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3 bg-white/5 w-fit px-3 py-1 rounded">
                 IPL 2026 SEASON | SYSTEM ONLINE
               </p>
             </div>
          </div>

          <div className="flex flex-col gap-12">
            {/* Today's Section */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/30 to-primary/10"></div>
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em] whitespace-nowrap flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                   Active Epochs: Today
                </h2>
                <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-primary/30 to-primary/10"></div>
              </div>
              
              {todayMatches.length > 0 ? (
                todayMatches.map((match) => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    onPredict={handlePredict}
                    userPrediction={predictions[match.id]}
                  />
                ))
              ) : (
                <div className="p-8 text-center glass-panel border-dashed border-white/10 rounded-2xl opacity-50">
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">No Active Epochs Scheduled for Today</p>
                </div>
              )}
            </div>

            {/* Future Section */}
            {futureMatches.length > 0 && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-secondary/30 to-secondary/10"></div>
                  <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em] whitespace-nowrap flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-secondary"></div>
                     Upcoming Phases: Future
                  </h2>
                  <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-secondary/30 to-secondary/10"></div>
                </div>
                
                {futureMatches.map((match) => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    onPredict={handlePredict}
                    userPrediction={predictions[match.id]}
                    isFuture={true}
                  />
                ))}
              </div>
            )}

            {todayMatches.length === 0 && futureMatches.length === 0 && (
              <div className="p-12 text-center glass-panel border-dashed border-white/10 rounded-2xl">
                 <Bot size={48} className="mx-auto text-slate-700 mb-4 animate-pulse" />
                 <p className="font-headline text-xl text-slate-500 font-bold uppercase italic tracking-widest">No Active Epochs Found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Global Standings & Activity */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 border-white/5">
             <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
               <Trophy size={14} className="text-tertiary" /> Elite Arenas
             </h3>
             <div className="flex flex-col gap-4">
                {[
                  { name: "Global League", users: formatCount(globalStats.userCount), icon: Globe, color: "text-primary" },
                  { name: "Neural Sync", users: formatCount(Math.ceil(globalStats.userCount * 0.8)), icon: Bot, color: "text-secondary" },
                  { name: "Apex Division", users: formatCount(Math.ceil(globalStats.userCount / 5)), icon: Zap, color: "text-tertiary" },
                ].map((arena) => (
                  <div key={arena.name} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-3 rounded-xl border border-transparent hover:border-white/5 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <arena.icon size={18} className={cn("transition-colors", arena.color)} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-white uppercase tracking-wider">{arena.name}</div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase">{arena.users} Players</div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative glass-panel p-8 rounded-2xl flex flex-col gap-6 items-center text-center border-white/10">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                 <Bot size={32} className="text-secondary animate-pulse" />
               </div>
               <div className="flex flex-col gap-2">
                 <div className="font-headline font-black text-2xl text-white uppercase italic tracking-tighter leading-none">
                    Neural <span className="text-secondary">Latency</span>
                 </div>
                 <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-relaxed">
                    {humanLead >= 0 ? "Humans" : "AI Core"} currently leading <br/> by <span className="text-primary font-black">+{Math.abs(humanLead).toFixed(1)}%</span> accuracy
                 </p>
               </div>
               <Link href="/arena" className="w-full">
                 <button className="w-full py-3 bg-white text-slate-950 text-[10px] font-black uppercase rounded shadow-xl hover:bg-slate-200 transition-all active:scale-95">
                    View Evolution Stats
                 </button>
               </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
