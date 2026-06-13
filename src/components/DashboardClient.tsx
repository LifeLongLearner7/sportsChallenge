"use client";

import React, { useState } from "react";
import { Match, Prediction, Profile } from "@/types";
import { 
  Trophy, 
  TrendingUp, 
  Bot, 
  Zap, 
  Globe,
  Command,
  Ghost,
  Activity,
} from "lucide-react";
import MatchCard from "./MatchCard";
import { submitPrediction } from "@/lib/data-actions";
import { trackPredictionSubmitted } from "@/lib/analytics";
import { AVATARS, MR_PREDICTO_AVATAR } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { 
  calculateLevel, 
  calculateTier, 
  calculatePulse, 
  getTierColor 
} from "@/lib/strategist-logic";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
  initialMatches: Match[];
  initialPredictions: Prediction[];
  profile: Profile | null;
  globalStats: {
    football: {
      userCount: number;
      avgHumanAccuracy: number;
      avgAiAccuracy: number;
    };
    cricket: {
      userCount: number;
      avgHumanAccuracy: number;
      avgAiAccuracy: number;
    };
  };
  totalUsers: number;
  rank: number;
}

export default function DashboardClient({ 
  initialMatches, 
  initialPredictions, 
  profile, 
  globalStats,
  totalUsers,
  rank
}: DashboardClientProps) {
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [activeSport, setActiveSport] = useState<'cricket' | 'football'>('football');
  const [predictions, setPredictions] = useState<Record<string, string>>(
    initialPredictions.reduce((acc, p) => ({ ...acc, [p.match_id]: p.prediction }), {})
  );

  const selectedAvatar = AVATARS.find(a => a.id === profile?.avatar_url) || AVATARS[0];

  const handlePredict = async (matchId: string, winner: string) => {
    try {
      setSavingMatchId(matchId);
      setPredictions((prev) => ({ ...prev, [matchId]: winner }));
      await submitPrediction(matchId, winner);

      // Track the prediction event in GA (using screen_name, never PII)
      const match = initialMatches.find((m) => m.id === matchId);
      if (match) {
        trackPredictionSubmitted({
          screenName: profile?.screen_name || "Strategist",
          matchId,
          teamA: match.team_a,
          teamB: match.team_b,
          chosenTeam: winner,
        });
      }
    } catch (error) {
      console.error("Prediction failed:", error);
      // Revert optimism on failure
      setPredictions((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      alert("⚠️ DATA SYNC FAILURE: Unable to preserve team selection. Please check your connectivity and try again.");
    } finally {
      setSavingMatchId(null);
    }
  };

  const points = profile?.points || 0;
  const level = calculateLevel(points);
  const tier = calculateTier(rank, totalUsers);
  const accuracy = profile?.accuracy || 0;
  const pulse = calculatePulse(accuracy, profile?.matches_predicted || 0);

  const formatCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentGlobalStats = globalStats[activeSport];

  const filteredMatches = initialMatches.filter(m => (m.sport || "cricket") === activeSport && m.status !== "completed");

  const sortedMatches = [...filteredMatches].sort((a, b) => 
    new Date(a.match_time).getTime() - new Date(b.match_time).getTime()
  );

  const todayMatches = sortedMatches.filter(match => {
    const isFootball = match.sport === "football";
    if (isFootball) {
      const matchTime = new Date(match.match_time).getTime();
      const now = new Date().getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      // Open if match starts within the next 24 hours, or if it is scheduled for today (includes active/live/completed)
      const isWithin24Hours = (matchTime - now <= oneDayMs) && (matchTime - now > 0);
      
      const matchDate = new Date(match.match_time);
      matchDate.setHours(0, 0, 0, 0);
      const isScheduledToday = matchDate.getTime() === today.getTime();
      
      return isWithin24Hours || isScheduledToday;
    } else {
      const matchDate = new Date(match.match_time);
      matchDate.setHours(0, 0, 0, 0);
      return matchDate.getTime() === today.getTime();
    }
  });

  const futureMatches = sortedMatches.filter(match => {
    const isFootball = match.sport === "football";
    if (isFootball) {
      const matchTime = new Date(match.match_time).getTime();
      const now = new Date().getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      const matchDate = new Date(match.match_time);
      matchDate.setHours(0, 0, 0, 0);
      const isScheduledToday = matchDate.getTime() === today.getTime();
      
      // More than 24 hours away AND not scheduled for today (avoids overlaps)
      return (matchTime - now > oneDayMs) && !isScheduledToday;
    } else {
      const matchDate = new Date(match.match_time);
      matchDate.setHours(0, 0, 0, 0);
      return matchDate.getTime() > today.getTime();
    }
  }).slice(0, 3);

  const humanLead = currentGlobalStats.avgHumanAccuracy - currentGlobalStats.avgAiAccuracy;

  return (
    <div className="min-h-screen bg-[#020205] text-slate-200 p-4 md:p-8 font-sans selection:bg-primary/30 pt-10">
      <div className="max-w-screen-2xl mx-auto space-y-10">
        
        {/* HUD Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
              <Command className="text-primary animate-pulse w-8 h-8" />
              CYBER-SPORTS <span className="text-primary/40 font-mono text-sm tracking-[0.3em] font-normal hidden md:inline ml-2">V2.4.0</span>
            </h1>
          </div>

        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Personal Stats */}
          <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[64px] rounded-full group-hover:bg-primary/10 transition-all" />
              
              {/* Avatar Section */}
              <Link href="/profile" className="flex flex-col items-center gap-3 mb-6 group/avatar">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden relative group-hover/avatar:border-primary/50 transition-all">
                    {selectedAvatar?.path ? (
                      <Image src={selectedAvatar.path} fill sizes="80px" className="object-cover rounded-full" alt="User avatar" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center">
                        <Ghost size={32} className="text-slate-600" />
                      </div>
                    )}
                  </div>
                  {/* Online pulse ring */}
                  <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#020205] shadow-[0_0_6px_#34d399]" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-black tracking-tight text-white group-hover/avatar:text-primary transition-colors">
                    {profile?.screen_name || "Strategist"}
                  </div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">View Profile →</div>
                </div>
              </Link>

              <div className="h-px w-full bg-white/5 mb-5" />

              <div className="flex items-center justify-between mb-6">
                <div className={cn("px-4 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-widest italic", getTierColor(tier))}>
                  {tier}
                </div>
                <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 text-[10px] font-mono text-white/40">
                  LEVEL {level}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-tight mb-1 font-sans">Global Rank</div>
                  <div className="text-xl font-headline font-black text-primary">#{rank}</div>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-tight mb-1 font-sans">Accuracy</div>
                  <div className="text-xl font-headline font-black text-secondary">{accuracy}%</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                 <div className="text-[9px] font-black text-slate-500 uppercase">Neural Status</div>
                 <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{pulse}</div>
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
                    <span className="text-white">{currentGlobalStats.avgHumanAccuracy}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary shadow-[0_0_8px_#81ecff]" style={{ width: `${currentGlobalStats.avgHumanAccuracy}%` }}></div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                    <span className="text-secondary/70">Mr. Predicto</span>
                    <span className="text-secondary">{currentGlobalStats.avgAiAccuracy}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary shadow-[0_0_8px_#ff6b98]" style={{ width: `${currentGlobalStats.avgAiAccuracy}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Match Feed */}
          <div className="lg:col-span-6 space-y-8">
             {/* Tournament Selector Tabs */}
             <div className="flex gap-4 border-b border-white/5 pb-6">
               <button
                 onClick={() => setActiveSport("football")}
                 className={cn(
                   "px-6 py-3 rounded-xl border text-xs font-mono uppercase tracking-widest transition-all",
                   activeSport === "football"
                     ? "bg-primary text-slate-950 border-primary shadow-[0_0_15px_rgba(129,236,255,0.2)]"
                     : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                 )}
               >
                 FIFA World Cup 2026
               </button>
               <button
                 onClick={() => setActiveSport("cricket")}
                 className={cn(
                   "px-6 py-3 rounded-xl border text-xs font-mono uppercase tracking-widest transition-all",
                   activeSport === "cricket"
                     ? "bg-primary text-slate-950 border-primary shadow-[0_0_15px_rgba(129,236,255,0.2)]"
                     : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                 )}
               >
                 IPL 2026 (Cricket)
               </button>
             </div>

             <div className="flex flex-col gap-10">
                {/* Today Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/30 to-primary/10"></div>
                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em] whitespace-nowrap flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      Active Epochs: {activeSport === "football" ? "Open" : "Today"}
                    </h2>
                    <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-primary/30 to-primary/10"></div>
                  </div>
                  
                  <div className="grid gap-6">
                    {todayMatches.length > 0 ? (
                      todayMatches.map((match) => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          onPredict={handlePredict}
                          userPrediction={predictions[match.id]}
                          isSaving={savingMatchId === match.id}
                        />
                      ))
                    ) : (
                      <div className="p-12 text-center glass-panel border-dashed border-white/10 rounded-2xl opacity-50">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                          No Active Epochs {activeSport === "football" ? "Open" : "Today"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Future Section */}
                {futureMatches.length > 0 && (
                  <div className="space-y-6 opacity-80">
                    <div className="flex items-center gap-4">
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                      <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] whitespace-nowrap">
                        Vanguard: Upcoming
                      </h2>
                      <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent"></div>
                    </div>
                    
                    <div className="grid gap-4">
                      {futureMatches.map((match) => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          onPredict={handlePredict}
                          userPrediction={predictions[match.id]}
                          isFuture={true}
                          isSaving={savingMatchId === match.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* Right Column: Global Standings */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 border-white/5 bg-black/40">
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                 <Trophy size={14} className="text-tertiary" /> Elite Arenas
               </h3>
               <div className="flex flex-col gap-4">
                  {[
                    { name: "Global League", users: formatCount(totalUsers), icon: Globe, color: "text-primary" },
                    { name: "Neural Sync", users: formatCount(Math.ceil(totalUsers * 0.8)), icon: Bot, color: "text-secondary" },
                    { name: "Apex Division", users: formatCount(Math.ceil(totalUsers / 5)), icon: Zap, color: "text-tertiary" },
                  ].map((arena) => (
                    <div key={arena.name} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <arena.icon size={16} className={arena.color} />
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
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative glass-panel p-8 rounded-2xl flex flex-col gap-6 items-center text-center border-white/10 overflow-hidden">
                 <div className="absolute -right-4 -top-4 text-white/[0.02] rotate-12">
                   <Target size={120} />
                 </div>
                 <div className="w-24 h-24 relative hex-clip border border-secondary/20 shadow-[0_0_30px_rgba(255,107,152,0.4)] overflow-hidden">
                    <Image 
                      src={MR_PREDICTO_AVATAR.path!} 
                      fill 
                      sizes="128px"
                      className="object-cover" 
                      alt="Mr. Predicto" 
                    />
                 </div>
                 <div className="flex flex-col gap-2">
                   <div className="font-headline font-black text-2xl text-white uppercase italic tracking-tighter leading-none">
                       vs <span className="text-secondary">Mr. Predicto</span>
                   </div>
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] leading-relaxed">
                       {humanLead >= 0 ? "Humans" : "Mr. Predicto"} leading <br/> by <span className="text-secondary">+{Math.abs(humanLead).toFixed(1)}%</span>
                    </p>
                 </div>
                 <Link href="/arena" className="w-full">
                    <button className="w-full py-2.5 bg-white text-slate-950 text-[9px] font-black uppercase rounded hover:bg-slate-200 transition-all">
                      Analysis Deck
                    </button>
                 </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function Target(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
