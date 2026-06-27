"use client";

import Image from "next/image";
import { Trophy, TrendingUp } from "lucide-react";
import { Profile } from "@/types";
import { ALL_IDENTITIES, MR_PREDICTO_AVATAR } from "@/lib/constants";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";

import { 
  calculateTier, 
  getTierColor 
} from "@/lib/strategist-logic";

interface LeaderboardClientProps {
  initialProfiles: Profile[];
  currentUserProfile: Profile | null;
  activeTournament: string;
  stats: {
    activeNodes: string;
    meanAccuracy: string;
    dominance: string;
  };
}

export default function LeaderboardClient({ 
  initialProfiles, 
  currentUserProfile, 
  activeTournament,
  stats 
}: LeaderboardClientProps) {
  const router = useRouter();
  const [gold, silver, bronze] = initialProfiles.slice(0, 3);
  const others = initialProfiles.slice(3);

  const getAvatar = (id: string | null | undefined, isAi?: boolean) => {
    if (isAi || id === 'mr_predicto') return MR_PREDICTO_AVATAR;
    return ALL_IDENTITIES.find(a => id && a.id === id) || ALL_IDENTITIES[0];
  };

  // Calculate current user's rank from the initial profiles list
  const userIndex = initialProfiles.findIndex(p => p.id === currentUserProfile?.id);
  const displayRank = userIndex !== -1 ? (userIndex + 1).toString().padStart(2, '0') : "N/A";

  return (
    <main className="min-h-screen pt-32 pb-20 bg-background relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] pointer-events-none"></div>
      
      <div className="max-w-screen-2xl mx-auto px-6 relative z-10 flex flex-col gap-16">
        {/* Header Section */}
        <div className="flex flex-col gap-4 text-center">
          <h1 className="font-headline text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
            STRATEGIST <span className="text-primary">LEADERBOARD</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">GLOBAL COMPETITIVE STANDINGS</p>
        </div>

        {/* Tournament Selector */}
        <div className="flex justify-center -mt-8 relative z-20">
          <div className="relative inline-block">
            <select
              value={activeTournament}
              onChange={(e) => {
                const newTournament = e.target.value;
                router.push(`?tournament=${encodeURIComponent(newTournament)}`);
              }}
              className="bg-black/60 border border-primary/30 text-white font-bold pl-6 pr-10 py-3 rounded-xl appearance-none outline-none focus:border-primary/80 transition-colors backdrop-blur-md cursor-pointer hover:bg-black/80 shadow-[0_0_20px_rgba(129,236,255,0.1)] text-center min-w-[200px]"
            >
              <option value="fifa_wc_2026">⚽ FIFA World Cup</option>
              <option value="IPL 2026">🏏 IPL 2026</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/70 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto w-full pt-10">
          {/* Silver - Rank 2 */}
          {silver && (
            <div className="order-2 md:order-1 flex flex-col items-center gap-6 group">
              <div className="relative">
                <div className={cn(
                  "w-24 h-24 relative hex-clip bg-white/5 border-2 p-1 transition-all duration-500 overflow-hidden flex items-center justify-center",
                  silver.is_ai 
                    ? "border-secondary shadow-[0_0_20px_rgba(255,107,152,0.4)]" 
                    : "border-slate-400 group-hover:border-primary shadow-[0_0_20px_rgba(148,163,184,0.3)]"
                )}>
                   {(() => {
                      const avatar = getAvatar(silver.avatar_url, silver.is_ai);
                      if (avatar.path) return <Image src={avatar.path} fill sizes="96px" className="object-cover" alt="User" />;
                      if (avatar.icon) {
                        const Icon = avatar.icon;
                        return <Icon size={32} className={silver.is_ai ? "text-secondary" : "text-slate-400"} />;
                      }
                      return null;
                   })()}
                </div>
                {silver.is_ai && (
                  <div className="absolute -top-2 -right-2 bg-secondary text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg z-30">
                    NEURAL CORE
                  </div>
                )}
                <div className={cn(
                  "absolute -bottom-3 left-1/2 -translate-x-1/2 font-black px-3 py-0.5 text-xs hex-clip",
                  silver.is_ai ? "bg-secondary text-white" : "bg-slate-400 text-slate-950"
                )}>02</div>
              </div>
              <div className="text-center">
                 {(() => {
                    const tier = calculateTier(2, initialProfiles.length);
                    const tierColor = getTierColor(tier);
                    return (
                      <div className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 border rounded-full mb-3 inline-block", tierColor)}>
                        {tier}
                      </div>
                    );
                 })()}
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
                
                <div className={cn(
                  "w-32 h-32 hex-clip bg-white/5 border-2 p-1.5 group-hover:scale-105 transition-all duration-700 overflow-hidden relative z-10 flex items-center justify-center",
                  gold.is_ai
                    ? "border-secondary shadow-[0_0_50px_rgba(255,107,152,0.6)]"
                    : "border-tertiary shadow-[0_0_40px_rgba(255,231,146,0.4)]"
                )}>
                   {(() => {
                      const avatar = getAvatar(gold.avatar_url, gold.is_ai);
                      if (avatar.path) return <Image src={avatar.path} fill sizes="128px" priority className="object-cover" alt="User" />;
                      if (avatar.icon) {
                        const Icon = avatar.icon;
                        return <Icon size={44} className={gold.is_ai ? "text-secondary" : "text-tertiary"} />;
                      }
                      return null;
                   })()}
                </div>
                {gold.is_ai && (
                  <div className="absolute -top-4 -right-4 bg-secondary text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_#ff6b98] z-30">
                    NEURAL CORE
                  </div>
                )}
                <div className={cn(
                  "absolute -bottom-4 left-1/2 -translate-x-1/2 font-black px-5 py-1 text-sm hex-clip z-20",
                  gold.is_ai ? "bg-secondary text-white" : "bg-tertiary text-slate-950"
                )}>01</div>
                <Trophy className="absolute -top-10 left-1/2 -translate-x-1/2 text-tertiary drop-shadow-[0_0_15px_rgba(255,231,146,0.8)]" size={40} />
              </div>
              <div className="text-center">
                 {(() => {
                    const tier = calculateTier(1, initialProfiles.length);
                    const tierColor = getTierColor(tier);
                    return (
                      <div className={cn("text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1 border rounded-full mb-4 inline-block shadow-lg", tierColor)}>
                        {tier}
                      </div>
                    );
                 })()}
                <div className="font-black text-white uppercase tracking-tight text-2xl mb-1">{gold.screen_name || "STRATEGIST_" + gold.id.slice(0,4)}</div>
                <div className="text-tertiary font-bold text-lg">{(gold.points || 0).toLocaleString()} PTS</div>
              </div>
            </div>
          )}

          {/* Bronze - Rank 3 */}
          {bronze && (
            <div className="order-3 md:order-3 flex flex-col items-center gap-6 group">
              <div className="relative">
                <div className={cn(
                  "w-24 h-24 relative hex-clip bg-white/5 border-2 p-1 transition-all duration-500 overflow-hidden flex items-center justify-center",
                  bronze.is_ai
                    ? "border-secondary shadow-[0_0_20px_rgba(255,107,152,0.4)]"
                    : "border-orange-400 group-hover:border-primary shadow-[0_0_20px_rgba(251,146,60,0.3)]"
                )}>
                   {(() => {
                      const avatar = getAvatar(bronze.avatar_url, bronze.is_ai);
                      if (avatar.path) return <Image src={avatar.path} fill sizes="96px" className="object-cover" alt="User" />;
                      if (avatar.icon) {
                        const Icon = avatar.icon;
                        return <Icon size={32} className={bronze.is_ai ? "text-secondary" : "text-orange-400"} />;
                      }
                      return null;
                   })()}
                </div>
                {bronze.is_ai && (
                  <div className="absolute -top-2 -right-2 bg-secondary text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg z-30">
                    NEURAL CORE
                  </div>
                )}
                <div className={cn(
                  "absolute -bottom-3 left-1/2 -translate-x-1/2 font-black px-3 py-0.5 text-xs hex-clip",
                  bronze.is_ai ? "bg-secondary text-white" : "bg-orange-400 text-slate-950"
                )}>03</div>
              </div>
              <div className="text-center">
                 {(() => {
                    const tier = calculateTier(3, initialProfiles.length);
                    const tierColor = getTierColor(tier);
                    return (
                      <div className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 border rounded-full mb-3 inline-block", tierColor)}>
                        {tier}
                      </div>
                    );
                 })()}
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
                  <div className={cn(
                    "w-16 h-16 md:w-12 md:h-12 relative hex-clip bg-white/5 border flex items-center justify-center overflow-hidden shadow-inner",
                    ranker.is_ai ? "border-secondary/50 shadow-[0_0_10px_rgba(255,107,152,0.2)]" : "border-white/10"
                  )}>
                    {(() => {
                      const avatar = getAvatar(ranker.avatar_url, ranker.is_ai);
                      if (avatar.path) return <Image src={avatar.path} fill sizes="64px" className="object-cover" alt="User" />;
                      if (avatar.icon) {
                        const Icon = avatar.icon;
                        return <Icon size={26} className={ranker.is_ai ? "text-secondary" : "text-slate-600"} />;
                      }
                      return <TrendingUp size={26} className="text-slate-600" />;
                    })()}
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <div className={cn(
                      "font-black uppercase text-base md:text-sm tracking-tight mb-0.5 transition-colors flex items-center gap-2",
                      ranker.is_ai ? "text-secondary" : "text-white group-hover:text-primary"
                    )}>
                      {ranker.screen_name || "Predictor_" + ranker.id.slice(0,4)}
                      {ranker.is_ai && (
                        <span className="text-[7px] bg-secondary/20 text-secondary border border-secondary/40 px-1.5 py-0.5 rounded-full animate-pulse">
                          NEURAL CORE
                        </span>
                      )}
                    </div>
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
            { label: "Active Nodes", value: stats.activeNodes, color: "text-white" },
            { label: "Mean Accuracy", value: stats.meanAccuracy, color: "text-primary" },
            { label: "Human Dominance", value: stats.dominance, color: "text-secondary" },
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
               #{displayRank}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
