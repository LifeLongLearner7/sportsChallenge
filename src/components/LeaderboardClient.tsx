"use client";

import Navbar from "@/components/Navbar";
import { Trophy, Bot, TrendingUp } from "lucide-react";
import { Profile } from "@/types";

interface LeaderboardClientProps {
  rankers: Profile[];
  currentUserProfile: Profile | null;
}

export default function LeaderboardClient({ rankers, currentUserProfile }: LeaderboardClientProps) {
  const topThree = rankers.slice(0, 3);
  const others = rankers.slice(3);

  // Helper to get color/tier based on index
  const getRankStats = (idx: number) => {
    if (idx === 0) return { rank: "01", tier: "MVP", color: "text-primary", bg: "bg-primary/20", shadow: "shadow-[0_0_30px_rgba(129,236,255,0.4)]" };
    if (idx === 1) return { rank: "02", tier: "SILV", color: "text-secondary", bg: "bg-secondary/10", shadow: "shadow-[0_0_20px_rgba(255,107,152,0.2)]" };
    return { rank: "03", tier: "GOLD", color: "text-tertiary", bg: "bg-tertiary/10", shadow: "shadow-[0_0_20px_rgba(255,184,77,0.2)]" };
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-6 overflow-x-hidden">
      <Navbar isAdmin={currentUserProfile?.is_admin} />
      
      <div className="max-w-screen-xl mx-auto">
        {/* Header Section */}
        <header className="mb-16 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-headline text-6xl md:text-7xl font-black tracking-tighter uppercase text-white italic leading-none">
              The <span className="text-primary">Arena</span> Standings
            </h1>
            <p className="font-sans text-slate-500 max-w-lg text-[10px] uppercase font-black tracking-[0.3em] mt-4 flex items-center gap-3">
              <span className="w-8 h-px bg-primary/30"></span>
              REAL-TIME NEURAL TRAJECTORY | ACTIVE SEASON 01
            </p>
          </div>
          <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/5 shadow-2xl">
            <button className="px-8 py-2.5 rounded-lg text-[10px] font-black bg-primary text-slate-950 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(129,236,255,0.3)]">GLOBAL</button>
            <button className="px-8 py-2.5 rounded-lg text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest">FRIENDS</button>
          </div>
        </header>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20 items-end">
          {topThree.map((ranker, idx) => {
            const stats = getRankStats(idx);
            return (
              <div 
                key={ranker.id} 
                className={`relative group ${idx === 0 ? 'order-1 md:order-2 scale-110 z-10' : idx === 1 ? 'order-2 md:order-1' : 'order-3'}`}
              >
                <div className="absolute -top-6 -left-6 font-headline text-9xl font-black text-white/[0.03] pointer-events-none italic">
                  {stats.rank}
                </div>
                <div className={`glass-panel rounded-3xl p-10 border ${idx === 0 ? 'border-primary/40' : 'border-white/10'} relative overflow-hidden transition-all hover:-translate-y-2 ${stats.shadow} bg-gradient-to-b from-white/[0.02] to-transparent`}>
                  <div className={`absolute top-0 right-0 w-40 h-40 ${stats.bg} blur-[80px] -mr-20 -mt-20 opacity-50`}></div>
                  
                  <div className="relative flex flex-col items-center">
                    <div className="w-28 h-28 mb-8 relative">
                      <div className={`absolute inset-0 ${stats.color.replace('text-', 'bg-')}/20 blur-2xl opacity-40 animate-pulse`}></div>
                      <div className="w-full h-full hex-clip bg-surface-container-highest flex items-center justify-center p-1 border-2 border-white/10 overflow-hidden shadow-inner">
                         {ranker.avatar_url ? (
                           <img src={ranker.avatar_url} className="w-full h-full object-cover" alt={ranker.screen_name || "Ranker"} />
                         ) : (
                           <TrendingUp size={48} className={stats.color} />
                         )}
                      </div>
                      <div className={`absolute -bottom-3 -right-3 ${stats.color.replace('text-', 'bg-')} text-slate-950 px-3 py-1 rounded shadow-lg flex items-center justify-center font-black text-[10px] tracking-widest uppercase`}>
                        {stats.tier}
                      </div>
                    </div>
                    
                    <h3 className="font-headline text-2xl font-black mb-1 uppercase italic tracking-tighter flex items-center gap-2 text-white">
                      {ranker.screen_name || "Unknown_User"}
                    </h3>
                    <p className={`${stats.color} font-black text-[10px] mb-6 tracking-[0.2em] uppercase`}>{ranker.accuracy}% ACCURACY</p>
                    
                    <div className="text-5xl font-black font-headline text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] italic tracking-tighter">
                      {(ranker.points || 0).toLocaleString()} <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase ml-1 not-italic">PTS</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leaderboard Table-like List */}
        <div className="glass-panel rounded-[2rem] overflow-hidden mb-16 border-white/5 shadow-2xl">
          <div className="grid grid-cols-12 px-10 py-8 text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase border-b border-white/5 bg-white/[0.01]">
            <div className="col-span-1">RANK</div>
            <div className="col-span-4">PREDICTOR</div>
            <div className="col-span-2 text-center">ACCURACY</div>
            <div className="col-span-3 text-center px-8">MOMENTUM DELTA</div>
            <div className="col-span-2 text-right">CREDITS</div>
          </div>
          
          <div className="divide-y divide-white/5">
            {others.map((ranker, idx) => (
              <div key={ranker.id} className="grid grid-cols-12 px-10 py-8 items-center hover:bg-white/5 transition-all group cursor-pointer border-l-4 border-transparent hover:border-primary/40">
                <div className="col-span-1 font-headline text-3xl font-black text-slate-700 group-hover:text-primary transition-colors italic tracking-tighter">
                  {(idx + 4).toString().padStart(2, '0')}
                </div>
                <div className="col-span-4 flex items-center gap-5">
                  <div className="w-12 h-12 hex-clip bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                    {ranker.avatar_url ? (
                       <img src={ranker.avatar_url} className="w-full h-full object-cover" alt="User" />
                    ) : (
                       <TrendingUp size={22} className="text-slate-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-black text-white uppercase text-sm tracking-tight mb-0.5 group-hover:text-primary transition-colors">
                      {ranker.screen_name || "Predictor_" + ranker.id.slice(0,4)}
                    </div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">ELITE ARCHITECT</div>
                  </div>
                </div>
                <div className="col-span-2 text-center font-black text-white tracking-widest">{ranker.accuracy}%</div>
                <div className="col-span-3 px-12">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-primary shadow-[0_0_12px_rgba(129,236,255,0.6)] rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (ranker.accuracy / 100) * 110)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="col-span-2 text-right font-headline text-2xl font-black text-white italic tracking-tighter">
                  {(ranker.points || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Nodes", value: "42,891", color: "text-white" },
            { label: "Mean Accuracy", value: "64.2%", color: "text-primary" },
            { label: "Human Dominance", value: "+14.2%", color: "text-secondary" },
            { label: "Tactical Rank", value: currentUserProfile ? `#${Math.floor(Math.random() * 1000)}` : "N/A", color: "text-tertiary" },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-8 rounded-3xl flex flex-col gap-3 border-white/5 hover:border-white/10 transition-colors shadow-xl">
              <div className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase">{stat.label}</div>
              <div className={`text-4xl font-headline font-black ${stat.color} italic tracking-tighter`}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
