"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Calendar, MapPin, Trophy, Bot } from "lucide-react";
import { Match } from "@/types";
import { TEAM_LOGOS, MR_PREDICTO_AVATAR } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  onPredict: (matchId: string, winner: string) => void;
  userPrediction?: string;
  isFuture?: boolean;
}

export default function MatchCard({ match, onPredict, userPrediction, isFuture }: MatchCardProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);
  const isUpcoming = match.status === "upcoming" || match.status === "active";
  const hasPredicted = !!userPrediction;

  useEffect(() => {
    setFormattedDate(new Date(match.match_time).toLocaleDateString());

    const updateTimer = () => {
      const now = new Date();
      const matchTime = new Date(match.match_time);
      const diff = matchTime.getTime() - now.getTime();
      const lockoutThreshold = 60 * 60 * 1000; // 1 hour

      if (diff <= lockoutThreshold) {
        setIsLocked(true);
        setTimeRemaining("00:00:00");
      } else {
        const remainingToLockout = diff - lockoutThreshold;
        const hours = Math.floor(remainingToLockout / (1000 * 60 * 60));
        const minutes = Math.floor((remainingToLockout % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingToLockout % (1000 * 60)) / 1000);
        
        setTimeRemaining(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
        setIsLocked(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [match.match_time]);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden transition-all hover:border-primary/30 group">
      <div className="p-6 flex flex-col gap-6">
        {/* Match Header */}
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-primary" />
            {formattedDate || "..."}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-secondary" />
            {match.venue}
          </div>
        </div>

        {/* Teams Section */}
         <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col items-center gap-3 flex-1 text-center">
            <div className={cn(
              "w-16 h-16 rounded-full border border-white/5 flex items-center justify-center hex-clip overflow-hidden shadow-xl transition-all group-hover:border-primary/50 relative",
              !TEAM_LOGOS[match.team_a] && "bg-surface-container-highest"
            )}>
               {TEAM_LOGOS[match.team_a] ? (
                 <Image src={TEAM_LOGOS[match.team_a]} fill sizes="64px" className="object-cover" alt={match.team_a} />
               ) : (
                 <span className="text-xl font-black text-white">{match.team_a[0]}</span>
               )}
               {TEAM_LOGOS[match.team_a] && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>}
            </div>
            <span className="font-headline font-bold text-sm uppercase tracking-tighter text-white/90">{match.team_a}</span>
          </div>

          <div className="flex flex-col items-center gap-1 group/vs">
            <span className="text-2xl font-black italic text-primary/30 group-hover/vs:text-primary transition-colors duration-500">VS</span>
            <div className={cn(
               "px-3 py-1 rounded-full text-[8px] font-black border uppercase tracking-[0.2em] transition-all duration-500",
               match.status === "active" 
                 ? "bg-primary/20 text-primary border-primary/40 shadow-[0_0_10px_rgba(129,236,255,0.2)]" 
                 : "bg-surface-container-highest text-secondary border-secondary/20"
            )}>
              {match.status}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 flex-1 text-center">
            <div className={cn(
              "w-16 h-16 rounded-full border border-white/5 flex items-center justify-center hex-clip overflow-hidden shadow-xl transition-all group-hover:border-primary/50 relative",
              !TEAM_LOGOS[match.team_b] && "bg-surface-container-highest"
            )}>
               {TEAM_LOGOS[match.team_b] ? (
                 <Image src={TEAM_LOGOS[match.team_b]} fill sizes="64px" className="object-cover" alt={match.team_b} />
               ) : (
                 <span className="text-xl font-black text-white">{match.team_b[0]}</span>
               )}
               {TEAM_LOGOS[match.team_b] && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>}
            </div>
            <span className="font-headline font-bold text-sm uppercase tracking-tighter text-white/90">{match.team_b}</span>
          </div>
        </div>

        {/* Prediction Controls or AI Reveal */}
        <div className="mt-4 pt-6 border-t border-white/5">
          {!hasPredicted && isUpcoming ? (
            <div className="flex flex-col gap-4">
              {!isFuture && !isLocked && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-2 rounded-lg px-4">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Closing In:</span>
                  <span className="text-sm font-mono font-black text-white">{timeRemaining}</span>
                </div>
              )}
              
              {isFuture ? (
                 <div className="py-3 bg-white/5 border border-white/10 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] rounded-md text-center">
                   Phase locked: Predictions opening soon
                 </div>
              ) : isLocked ? (
                 <div className="py-3 bg-red-500/10 border border-red-500/30 text-[10px] font-black uppercase text-red-400 tracking-[0.2em] rounded-md text-center">
                   Prediction Closed
                 </div>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => onPredict(match.id, match.team_a)}
                    className="flex-1 py-3 bg-surface-container-high border border-primary/20 hover:border-primary text-xs font-bold uppercase tracking-widest rounded-md transition-all active:scale-95"
                  >
                    {match.team_a}
                  </button>
                  <button 
                    onClick={() => onPredict(match.id, match.team_b)}
                    className="flex-1 py-3 bg-surface-container-high border border-primary/20 hover:border-primary text-xs font-bold uppercase tracking-widest rounded-md transition-all active:scale-95"
                  >
                    {match.team_b}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                       <Trophy size={14} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Your Pick</span>
                  </div>
                  <span className="text-xs font-headline font-bold text-white uppercase italic">{userPrediction}</span>
               </div>

               {/* AI Prediction Reveal */}
               <div className="bg-secondary/5 p-4 rounded-lg border border-secondary/20 relative overflow-hidden group/ai">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 blur-2xl -mr-12 -mt-12"></div>
                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                       <div className="relative w-4 h-4 hex-clip shadow-[0_0_8px_rgba(255,107,152,0.3)]">
                          <Image src={MR_PREDICTO_AVATAR.path!} fill className="object-cover" alt="" />
                       </div>
                          <span className="text-[10px] font-black text-secondary tracking-widest uppercase italic">Mr. Predicto's Pick</span>
                       </div>
                       <span className="text-[10px] font-bold text-secondary">{match.ai_confidence}% Match Depth</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-headline font-black text-white italic uppercase tracking-tighter">MR. PREDICTO: {match.ai_prediction}</span>
                    </div>
                    {match.ai_reasoning && (
                      <p className="text-[9px] text-slate-400 leading-relaxed italic border-l-2 border-secondary/30 pl-2 mt-1">
                        &quot;{match.ai_reasoning}&quot;
                      </p>
                    )}

                    {/* AI FAILURE MESSAGE: "Outfoxed" */}
                    {match.status === "completed" && match.winner && match.ai_prediction && match.ai_prediction !== match.winner && (
                      <div className="mt-3 py-2 px-3 bg-red-500/10 border border-red-500/20 rounded flex items-center justify-between animate-pulse">
                          <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Mr. Predicto Got It Wrong!</span>
                         <span className="text-[9px] font-bold text-white px-2 py-0.5 bg-red-500/20 rounded-full border border-red-500/30">
                           {match.outfoxed_count || 0} Outfoxed It
                         </span>
                      </div>
                    )}

                    {/* AI SUCCESS MESSAGE */}
                    {match.status === "completed" && match.winner && match.ai_prediction === match.winner && (
                      <div className="mt-3 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-between">
                          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Mr. Predicto Nailed It</span>
                         <span className="text-[9px] font-bold text-white px-2 py-0.5 bg-emerald-500/20 rounded-full">Optimal Pick</span>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
