import { Flame, BrainCircuit } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ShareButtons from "./ShareButtons";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BraggingRightsCardProps {
  currentStreak: number;
  aiBeatenCount: number;
}

export default function BraggingRightsCard({ currentStreak, aiBeatenCount }: BraggingRightsCardProps) {
  // If no stats, don't show the card to keep the UI clean
  if (currentStreak === 0 && aiBeatenCount === 0) return null;

  return (
    <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6 relative overflow-hidden border-tertiary/20">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
        <div>
          <h2 className="font-headline text-2xl font-black text-white uppercase italic flex items-center gap-2">
            Bragging Rights
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Let the world know your tactical prowess.
          </p>
        </div>
        
        <ShareButtons currentStreak={currentStreak} aiBeatenCount={aiBeatenCount} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 relative z-10">
        <div className="bg-surface-container/50 border border-white/5 rounded-2xl p-6 flex items-center gap-5">
           <div className={cn(
             "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0",
             currentStreak >= 3 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.3)] animate-pulse" : "bg-primary/10 text-primary border border-primary/20"
           )}>
             <Flame size={28} />
           </div>
           <div>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Winning Streak</div>
             <div className="text-3xl font-headline font-black text-white italic mt-1">
               {currentStreak}
               <span className="text-base text-slate-400 normal-case font-sans font-normal ml-2">Matches</span>
             </div>
           </div>
        </div>

        <div className="bg-surface-container/50 border border-white/5 rounded-2xl p-6 flex items-center gap-5">
           <div className={cn(
             "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0",
             aiBeatenCount > 0 ? "bg-tertiary/20 text-tertiary border border-tertiary/30 shadow-[0_0_20px_rgba(255,231,146,0.3)]" : "bg-primary/10 text-primary border border-primary/20"
           )}>
             <BrainCircuit size={28} />
           </div>
           <div>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Outfoxed</div>
             <div className="text-3xl font-headline font-black text-white italic mt-1">
               {aiBeatenCount}
               <span className="text-base text-slate-400 normal-case font-sans font-normal ml-2">Times</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
