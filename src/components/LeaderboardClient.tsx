"use client";

import Navbar from "@/components/Navbar";
import { Trophy, TrendingUp } from "lucide-react";
import { Profile } from "@/types";

interface LeaderboardClientProps {
  rankers: Profile[];
  currentUserProfile: (Profile & { rank: number }) | null;
  globalStats: {
    activeNodes: string;
    meanAccuracy: string;
    dominance: string;
  };
}

export default function LeaderboardClient({ rankers, currentUserProfile, globalStats }: LeaderboardClientProps) {
  const [gold, silver, bronze] = top3;

  return (
    <main className="min-h-screen pt-32 pb-20 bg-background relative overflow-hidden">
      <Navbar isAdmin={currentUserProfile?.is_admin} />
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] pointer-events-none"></div>
      
      <div className="max-w-screen-2xl mx-auto px-6 relative z-10 flex flex-col gap-16">
        {/* Header Section */}
        <div className="flex flex-col gap-4 text-center">
          <h1 className="font-headline text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
            STRATEGIST <span className="text-primary">LEADERBOARD</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">GLOBAL COMPETITIVE STANDINGS • EPOCH 07</p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto w-full">
          {/* Silver - Rank 2 */}
          {silver && (
            <div className="order-2 md:order-1 flex flex-col items-center gap-6 group">
              <div className="relative">
                <div className="w-24 h-24 hex-clip bg-white/5 border-2 border-slate-400 p-1 group-hover:border-primary transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(148,163,184,0.3)]">
                   {silver.avatar_url ? (
                      <img src={silver.avatar_url} className="w-full h-full object-cover" alt="User" />
                   ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">U2</div>
                   )}
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-400 text-slate-950 font-black px-3 py-0.5 text-xs hex-clip">02</div>
              </div>
              <div className="text-center">
                <div className="font-black text-white uppercase tracking-tight text-lg mb-1">{silver.screen_name || "STRATEGIST_" + silver.id.slice(0,4)}</div>
                <div className="text-primary font-bold">{(silver.points || 0).toLocaleString()} PTS</div>
              </div>
            </div>
          )}

          {/* Gold - Rank 1 */}
          {gold && (
            <div className="order-1 md:order-2 flex flex-col items-center gap-8 group mb-8 md:mb-16">
              <div className="relative">
                 {/* Halo effect for gold */}
                <div className="absolute inset-0 bg-tertiary/20 rounded-full blur-3xl animate-pulse"></div>
                
                <div className="w-32 h-32 hex-clip bg-white/5 border-2 border-tertiary p-1.5 group-hover:scale-105 transition-all duration-700 overflow-hidden shadow-[0_0_40px_rgba(255,231,146,0.4)] relative z-10">
                   {gold.avatar_url ? (
                      <img src={gold.avatar_url} className="w-full h-full object-cover" alt="User" />
                   ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-tertiary font-bold">U1</div>
                   )}
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-tertiary text-slate-950 font-black px-5 py-1 text-sm hex-clip z-20">01</div>
                <Trophy className="absolute -top-10 left-1/2 -translate-x-1/2 text-tertiary drop-shadow-[0_0_15px_rgba(255,231,146,0.8)]" size={40} />
              </div>
              <div className="text-center">
                <div className="font-black text-white uppercase tracking-tight text-2xl mb-1">{gold.screen_name || "STRATEGIST_" + gold.id.slice(0,4)}</div>
                <div className="text-tertiary font-bold text-lg">{(gold.points || 0).toLocaleString()} PTS</div>
              </div>
            </div>
          )}

          {/* Bronze - Rank 3 */}
          {bronze && (
            <div className="order-3 md:order-3 flex flex-col items-center gap-6 group">
              <div className="relative">
                <div className="w-24 h-24 hex-clip bg-white/5 border-2 border-orange-400 p-1 group-hover:border-primary transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(251,146,60,0.3)]">
                   {bronze.avatar_url ? (
                      <img src={bronze.avatar_url} className="w-full h-full object-cover" alt="User" />
                   ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-orange-400 font-bold">U3</div>
                   )}
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-400 text-slate-950 font-black px-3 py-0.5 text-xs hex-clip">03</div>
              </div>
              <div className="text-center">
                <div className="font-black text-white uppercase tracking-tight text-lg mb-1">{bronze.screen_name || "STRATEGIST_" + bronze.id.slice(0,4)}</div>
                <div className="text-primary font-bold">{(bronze.points || 0).toLocaleString()} PTS</div>
              </div>
            </div>
          )}
        </div>

        {/* Rest of Leaderboard Table */}
        <div className="glass-panel rounded-[40px] overflow-hidden border-white/5 shadow-2xl">
          <div className="bg-white/5 grid grid-cols-12 px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            <div className="col-span-1">RNK</div>
            <div className="col-span-4">IDENTIFIED STRATEGIST</div>
            <div className="col-span-2 text-center">PRECISION</div>
            <div className="col-span-3 px-12 text-center">VELOCITY</div>
            <div className="col-span-2 text-right">TOTAL PTS</div>
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
            { label: "Active Nodes", value: globalStats.activeNodes, color: "text-white" },
            { label: "Mean Accuracy", value: globalStats.meanAccuracy, color: "text-primary" },
            { label: "Human Dominance", value: globalStats.dominance, color: "text-secondary" },
            { label: "Tactical Rank", value: currentUserProfile ? `#${currentUserProfile.rank}` : "N/A", color: "text-tertiary" },
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
