"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Calendar, MapPin, Trophy, Bot } from "lucide-react";
import { Match } from "@/types";
import { TEAM_LOGOS, FIFA_TEAM_LOGOS, MR_PREDICTO_AVATAR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import TeamProfileModal from "@/components/TeamProfileModal";

interface MatchCardProps {
  match: Match;
  onPredict: (matchId: string, winner: string) => void;
  userPrediction?: string;
  isFuture?: boolean;
  isSaving?: boolean;
}

export default function MatchCard({ match, onPredict, userPrediction, isFuture, isSaving }: MatchCardProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);
  const [isIntelExpanded, setIsIntelExpanded] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const isFootball = match.sport === "football";
  const isUpcoming = match.status === "upcoming" || match.status === "active";
  const teamLogos = isFootball ? FIFA_TEAM_LOGOS : TEAM_LOGOS;
  const hasPredicted = !!userPrediction;

  useEffect(() => {
    setFormattedDate(new Date(match.match_time).toLocaleDateString());

    const updateTimer = () => {
      const now = new Date();
      const matchTime = new Date(match.match_time);
      const diff = matchTime.getTime() - now.getTime();
      // Football: lock at kick-off (0 mins). Cricket: lock 1 hour before.
      const lockoutThreshold = isFootball ? 0 : 60 * 60 * 1000;

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
  }, [match.match_time, isFootball]);

  return (
    <>
    <div className="glass-panel rounded-2xl overflow-hidden transition-all hover:border-primary/30 group">
      <div className={cn("p-6 flex flex-col gap-6", isSaving && "opacity-50 pointer-events-none")}>
        {/* Match Header */}
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-primary" />
            {formattedDate || "..."}
          </div>
          <div className="flex items-center gap-2">
            {isFootball && (match as any).round && (
              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-black rounded-full uppercase tracking-widest">
                {(match as any).round}
              </span>
            )}
            <MapPin size={12} className="text-secondary" />
            {match.venue}
          </div>
        </div>

        {/* Teams Section */}
         <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col items-center gap-3 flex-1 text-center">
            <div
              className={cn(
                "w-16 h-16 rounded-full border border-white/5 flex items-center justify-center hex-clip overflow-hidden shadow-xl transition-all group-hover:border-primary/50 relative",
                !teamLogos[match.team_a] && "bg-surface-container-highest",
                isFootball && "cursor-pointer hover:ring-2 hover:ring-primary/40 hover:scale-105"
              )}
              onClick={isFootball ? () => setSelectedTeam(match.team_a) : undefined}
              title={isFootball ? `View ${match.team_a} profile` : undefined}
            >
               {teamLogos[match.team_a] ? (
                 <Image src={teamLogos[match.team_a]} fill sizes="64px" className="object-cover" alt={match.team_a} />
               ) : (
                 <span className="text-xl font-black text-white">{match.team_a[0]}</span>
               )}
               {teamLogos[match.team_a] && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>}
               {isFootball && (
                 <div className="absolute inset-0 bg-primary/0 hover:bg-primary/10 transition-colors flex items-end justify-center pb-1 pointer-events-none">
                   <span className="text-[7px] font-black text-primary/0 group-hover:text-primary/60 uppercase tracking-widest transition-colors">INFO</span>
                 </div>
               )}
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
            <div
              className={cn(
                "w-16 h-16 rounded-full border border-white/5 flex items-center justify-center hex-clip overflow-hidden shadow-xl transition-all group-hover:border-primary/50 relative",
                !teamLogos[match.team_b] && "bg-surface-container-highest",
                isFootball && "cursor-pointer hover:ring-2 hover:ring-primary/40 hover:scale-105"
              )}
              onClick={isFootball ? () => setSelectedTeam(match.team_b) : undefined}
              title={isFootball ? `View ${match.team_b} profile` : undefined}
            >
               {teamLogos[match.team_b] ? (
                 <Image src={teamLogos[match.team_b]} fill sizes="64px" className="object-cover" alt={match.team_b} />
               ) : (
                 <span className="text-xl font-black text-white">{match.team_b[0]}</span>
               )}
               {teamLogos[match.team_b] && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>}
               {isFootball && (
                 <div className="absolute inset-0 bg-primary/0 hover:bg-primary/10 transition-colors flex items-end justify-center pb-1 pointer-events-none">
                   <span className="text-[7px] font-black text-primary/0 group-hover:text-primary/60 uppercase tracking-widest transition-colors">INFO</span>
                 </div>
               )}
            </div>
            <span className="font-headline font-bold text-sm uppercase tracking-tighter text-white/90">{match.team_b}</span>
          </div>
        </div>

        {/* Match Intel Section */}
        {match.match_intel && match.match_intel !== "No live news available." && (
           <div 
             onClick={() => setIsIntelExpanded(!isIntelExpanded)}
             className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg mt-2 cursor-pointer transition-all hover:bg-blue-500/20 active:bg-blue-500/30"
           >
             <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Match Intel</span>
             </div>
             <p className={cn(
               "text-xs text-blue-200/70 transition-all leading-relaxed whitespace-pre-line",
               !isIntelExpanded && "line-clamp-2"
             )}>
               {match.match_intel}
             </p>
             {!isIntelExpanded && (
               <div className="text-[8px] text-blue-400/50 uppercase tracking-widest text-center mt-1">Tap to read more</div>
             )}
           </div>
        )}

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
                    disabled={isSaving}
                    onClick={() => onPredict(match.id, match.team_a)}
                    className="flex-1 py-3 bg-surface-container-high border border-primary/20 hover:border-primary text-xs font-bold uppercase tracking-widest rounded-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? "..." : match.team_a}
                  </button>
                  {/* Draw option — only for football */}
                  {isFootball && (
                    <button
                      disabled={isSaving}
                      onClick={() => onPredict(match.id, "draw")}
                      className="px-4 py-3 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-amber-400 text-xs font-black uppercase tracking-widest rounded-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? "..." : "Draw"}
                    </button>
                  )}
                  <button 
                    disabled={isSaving}
                    onClick={() => onPredict(match.id, match.team_b)}
                    className="flex-1 py-3 bg-surface-container-high border border-primary/20 hover:border-primary text-xs font-bold uppercase tracking-widest rounded-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? "..." : match.team_b}
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
                          <Image 
                            src={MR_PREDICTO_AVATAR.path!} 
                            fill 
                            sizes="64px"
                            className="object-cover" 
                            alt="Mr. Predicto" 
                          />
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

    {/* Team Profile Modal — football only */}
    {isFootball && (
      <TeamProfileModal
        teamCode={selectedTeam}
        onClose={() => setSelectedTeam(null)}
      />
    )}
  </>
  );
}

