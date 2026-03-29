import { Prediction, Match } from "@/types";
import { CheckCircle2, XCircle, BrainCircuit, Zap, AlertTriangle } from "lucide-react";
import { getUserDetailedHistory } from "@/lib/data-actions";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DetailedPrediction extends Prediction {
  matches: Match;
}

interface DossierHistoryProps {
  userId: string;
  limit?: number;
}

export default async function DossierHistory({ userId, limit = 10 }: DossierHistoryProps) {
  const history = await getUserDetailedHistory(userId, limit) as unknown as DetailedPrediction[];
  if (!history || history.length === 0) {
    return (
      <div className="h-[200px] w-full bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <Zap size={20} className="text-slate-600" />
        </div>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">
          No matches recorded in tactical archives.<br/>Initiate first prediction to populate dossier.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {history.map((entry) => {
        const isCompleted = entry.matches.status === "completed";
        const isCorrect = isCompleted && (entry.prediction === entry.matches.winner || 
                          (entry.prediction === 'team_a' && entry.matches.winner === entry.matches.team_a) ||
                          (entry.prediction === 'team_b' && entry.matches.winner === entry.matches.team_b));
        
        const aiFollowed = entry.prediction === entry.matches.ai_prediction;
        const aiWasCorrect = isCompleted && (entry.matches.ai_prediction === entry.matches.winner ||
                             (entry.matches.ai_prediction === 'team_a' && entry.matches.winner === entry.matches.team_a) ||
                             (entry.matches.ai_prediction === 'team_b' && entry.matches.winner === entry.matches.team_b));

        return (
          <div key={entry.id} className="group relative glass-panel p-5 rounded-2xl border-white/5 hover:border-primary/30 transition-all duration-500 overflow-hidden">
             {/* Background Glow on Hover */}
             <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl rounded-2xl pointer-events-none" />
             
             <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                {/* Match Info */}
                <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black tracking-tighter text-slate-500 uppercase">Archive ID-{entry.id.slice(0, 8)}</span>
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-black uppercase italic",
                        isCompleted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      )}>
                        {isCompleted ? "Resolved" : "Active Data"}
                      </span>
                   </div>
                   <div className="text-lg font-headline font-black text-white italic tracking-tight uppercase">
                      {entry.matches.team_a} <span className="text-primary italic text-sm normal-case mr-1">vs</span> {entry.matches.team_b}
                   </div>
                   <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(entry.matches.match_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} // {entry.matches.venue || "Global Arena"}
                   </div>
                </div>

                {/* Tactical Stats */}
                <div className="flex flex-wrap items-center gap-8">
                   {/* User Prediction */}
                   <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Neural Logic</span>
                      <div className="flex items-center gap-2">
                         <span className="font-headline font-bold text-sm text-white uppercase italic">
                            {entry.prediction === 'team_a' ? entry.matches.team_a : entry.prediction === 'team_b' ? entry.matches.team_b : entry.prediction}
                         </span>
                         {isCompleted && (
                            isCorrect ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-rose-400" />
                         )}
                      </div>
                   </div>

                   {/* AI Comparison */}
                   <div className="flex flex-col gap-1 min-w-[120px]">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <BrainCircuit size={10} className="text-primary" /> AI Pulse
                      </span>
                      <div className="flex items-center gap-2">
                         <span className={cn(
                            "text-[10px] font-black uppercase italic px-2 py-0.5 rounded border",
                            aiFollowed ? "bg-primary/10 text-primary border-primary/20" : "bg-tertiary/10 text-tertiary border-tertiary/20"
                         )}>
                            {aiFollowed ? "Followed AI" : "Defied AI"}
                         </span>
                         {isCompleted && (
                            <span className={cn(
                               "text-[9px] font-black",
                               entry.points_won && entry.points_won > 100 ? "text-tertiary shadow-[0_0_10px_rgba(255,231,146,0.3)]" : 
                               isCorrect ? "text-emerald-400" : "text-rose-400"
                            )}>
                               {entry.points_won !== undefined && entry.points_won !== null 
                                 ? `+${entry.points_won} PTS` 
                                 : isCorrect 
                                   ? (aiWasCorrect ? "+100 PTS" : "+150 PTS") 
                                   : "0 PTS"}
                            </span>
                         )}

                      </div>
                   </div>
                </div>
             </div>

             {/* Bottom Outcome Bar */}
             {isCompleted && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Outcome:</span>
                      <span className="text-[11px] font-black text-emerald-400 uppercase italic tracking-tighter">Winner: {entry.matches.winner}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      {!aiFollowed && isCorrect && (
                         <div className="flex items-center gap-1.5 px-3 py-1 bg-tertiary/20 border border-tertiary/40 rounded-lg">
                            <Zap size={10} className="text-tertiary animate-pulse" />
                            <span className="text-[10px] font-black text-tertiary uppercase italic">Human Superiority Confirmed</span>
                         </div>
                      )}
                      {aiFollowed && !isCorrect && (
                         <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                            <AlertTriangle size={10} className="text-rose-400" />
                            <span className="text-[10px] font-black text-rose-400 uppercase italic">Collateral AI Failure</span>
                         </div>
                      )}
                   </div>
                </div>
             )}
          </div>
        );
      })}
    </div>
  );
}
