"use client";

import Navbar from "@/components/Navbar";
import Image from "next/image";
import { Trophy, TrendingUp } from "lucide-react";
import { Profile } from "@/types";
import { ALL_IDENTITIES } from "@/lib/constants";
import { useEffect, useState } from "react";
import { getUserTacticalRank } from "@/lib/data-actions";

interface LeaderboardClientProps {
  rankers: Profile[];
  currentUserProfile: Profile | null;
  globalStats: {
    activeNodes: string;
    meanAccuracy: string;
    dominance: string;
  };
}

export default function LeaderboardClient({ rankers, currentUserProfile, globalStats }: LeaderboardClientProps) {
  const [gold, silver, bronze] = rankers.slice(0, 3);
  const others = rankers.slice(3);
  const [tacticalRank, setTacticalRank] = useState<number | null>(null);

  useEffect(() => {
    if (currentUserProfile) {
      getUserTacticalRank(currentUserProfile.points).then(setTacticalRank);
    }
  }, [currentUserProfile]);

  const getAvatar = (id: string | null | undefined) => {
    return ALL_IDENTITIES.find(a => id && a.id === id) || ALL_IDENTITIES[0];
  };

  return (
    <main className="min-h-screen pt-32 pb-20 bg-background relative overflow-hidden">
      <Navbar isAdmin={currentUserProfile?.is_admin} profile={currentUserProfile} />
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] pointer-events-none"></div>
      
      <div className="max-w-screen-2xl mx-auto px-6 relative z-10 flex flex-col gap-16">
        {/* Header Section */}
        <div className="flex flex-col gap-4 text-center">
          <h1 className="font-headline text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
            STRATEGIST <span className="text-primary">LEADERBOARD</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">GLOBAL COMPETITIVE STANDINGS • EPOCH 01</p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto w-full">
          {/* Silver - Rank 2 */}
          {silver && (
            <div className="order-2 md:order-1 flex flex-col items-center gap-6 group">
              <div className="relative">
                <div className="w-24 h-24 relative hex-clip bg-white/5 border-2 border-slate-400 p-1 group-hover:border-primary transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(148,163,184,0.3)] flex items-center justify-center">
                   {(() => {
                      const avatar = getAvatar(silver.avatar_url);
                      if (avatar.path) return <Image src={avatar.path} fill sizes="96px" className="object-cover" alt="User" />;
                      if (avatar.icon) {
                        const Icon = avatar.icon;
                        return <Icon size={32} className="text-slate-400" />;
                      }
                      return null;
                   })()}
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
                
                <div className="w-32 h-32 hex-clip bg-white/5 border-2 border-tertiary p-1.5 group-hover:scale-105 transition-all duration-700 overflow-hidden shadow-[0_0_40px_rgba(255,231,146,0.4)] relative z-10 flex items-center justify-center">
                   {(() => {
                      const avatar = getAvatar(gold.avatar_url);
                      if (avatar.path) return <Image src={avatar.path} fill sizes="128px" priority className="object-cover" alt="User" />;
                      if (avatar.icon) {
                        const Icon = avatar.icon;
                        return <Icon size={44} className="text-tertiary" />;
                      }
                      return null;
                   })()}
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
                <div className="w-24 h-24 relative hex-clip bg-white/5 border-2 border-orange-400 p-1 group-hover:border-primary transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(251,146,60,0.3)] flex items-center justify-center">
                   {(() => {
                      const avatar = getAvatar(bronze.avatar_url);
                      if (avatar.path) return <Image src={avatar.path} fill sizes="96px" className="object-cover" alt="User" />;
                      if (avatar.icon) {
                        const Icon = avatar.icon;
                        return <Icon size={32} className="text-orange-400" />;
                      }
                      return null;
                   })()}
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
        <div className="glass-panel text-center md:text-left rounded-[30px] md:rounded-[40px] overflow-hidden border-white/5 shadow-2xl">
          <div className="hidden md:grid bg-white/5 grid-cols-12 px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            <div className="col-span-1">RNK</div>
            <div className="col-span-4">IDENTIFIED STRATEGIST</div>
            <div className="col-span-2 text-center">PRECISION</div>
            <div className="col-span-3 px-12 text-center">VELOCITY</div>
            <div className="col-span-2 text-right">TOTAL PTS</div>
          </div>

          <div className="divide-y divide-white/5">
            {others.map((ranker, idx) => (
              <div key={ranker.id} className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-0 px-6 md:px-10 py-8 items-center hover:bg-white/5 transition-all group cursor-pointer border-l-4 border-transparent hover:border-primary/40 relative">
                
                {/* Rank Badge - Absolute Mobile, Standard Desktop */}
                <div className="absolute top-4 left-6 md:static md:col-span-1 font-headline text-2xl md:text-3xl font-black text-slate-700 group-hover:text-primary transition-colors italic tracking-tighter">
                  {(idx + 4).toString().padStart(2, '0')}
                </div>
                
                {/* Avatar and Name */}
                <div className="md:col-span-4 flex flex-col md:flex-row items-center gap-4 md:gap-5 mt-4 md:mt-0">
                  <div className="w-16 h-16 md:w-12 md:h-12 relative hex-clip bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                    {(() => {
                      const avatar = getAvatar(ranker.avatar_url);
                      if (avatar.path) return <Image src={avatar.path} fill sizes="64px" className="object-cover" alt="User" />;
                      if (avatar.icon) {
                        const Icon = avatar.icon;
                        return <Icon size={26} className="text-slate-600" />;
                      }
                      return <TrendingUp size={26} className="text-slate-600" />;
                    })()}
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="font-black text-white uppercase text-base md:text-sm tracking-tight mb-0.5 group-hover:text-primary transition-colors">
                      {ranker.screen_name || "Predictor_" + ranker.id.slice(0,4)}
                    </div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">ELITE ARCHITECT</div>
                  </div>
                </div>
                
                {/* Mobile Only Quick Stats */}
                <div className="flex md:hidden w-full bg-black/40 border border-white/5 rounded-xl p-4 justify-between">
                  <div className="flex flex-col gap-1 items-center flex-1 border-r border-white/5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Precision</span>
                    <span className="font-black text-white">{ranker.accuracy}%</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center flex-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Points</span>
                    <span className="font-headline font-black text-xl italic text-primary">{(ranker.points || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Desktop Only Stats */}
                <div className="hidden md:block col-span-2 text-center font-black text-white tracking-widest">{ranker.accuracy}%</div>
                <div className="hidden md:block col-span-3 px-12">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-primary shadow-[0_0_12px_rgba(129,236,255,0.6)] rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (ranker.accuracy / 100) * 110)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="hidden md:block col-span-2 text-right font-headline text-2xl font-black text-white italic tracking-tighter">
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
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-8 rounded-3xl flex flex-col gap-3 border-white/5 hover:border-white/10 transition-colors shadow-xl">
              <div className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase">{stat.label}</div>
              <div className={`text-4xl font-headline font-black ${stat.color} italic tracking-tighter`}>{stat.value}</div>
            </div>
          ))}

          {/* Tactical Rank Card (Async) */}
          <div className="glass-panel p-8 rounded-3xl flex flex-col gap-3 border-white/5 hover:border-white/10 transition-colors shadow-xl">
            <div className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase">Tactical Rank</div>
            <div className="text-4xl font-headline font-black text-tertiary italic tracking-tighter">
              {currentUserProfile ? (tacticalRank ? `#${tacticalRank}` : <span className="animate-pulse">#_</span>) : "N/A"}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
