import React from 'react';
import { Trophy } from 'lucide-react';
import { getTopPredictor } from '@/lib/data-actions';

export default async function TopPredictorStream() {
  const topPredictor = await getTopPredictor();

  return (
    <div className="p-8 glass-panel rounded-2xl flex flex-col gap-5 group hover:bg-surface-container-high transition-all border-white/5 hover:border-primary/30 h-full">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 border border-primary/30 flex items-center justify-center hex-clip shadow-[0_0_20px_rgba(129,236,255,0.2)]">
          <Trophy className="text-primary" size={28} />
        </div>
        <h3 className="font-headline font-black text-2xl uppercase tracking-tighter italic text-white/50">
          TOP <span className="text-primary/70">PREDICTOR</span>
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <div className="w-full text-center text-primary font-headline font-black uppercase text-3xl italic tracking-tighter drop-shadow-[0_0_12px_rgba(129,236,255,0.7)] animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {topPredictor?.screen_name || "STRIKER_X"}
        </div>
        
        <div className="mt-2 bg-black/60 rounded-xl p-4 border border-white/5 shadow-inner flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">
            <span>Tactical Win Rate</span>
            <span className="text-white italic">{topPredictor?.accuracy || 0}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px] relative">
            <div 
              className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary-dim rounded-full shadow-[0_0_15px_rgba(129,236,255,0.4)] transition-all duration-1000"
              style={{ width: `${topPredictor?.accuracy || 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TopPredictorSkeleton() {
  return (
    <div className="p-8 glass-panel rounded-2xl flex flex-col gap-5 border-white/5 opacity-50 bg-white/2 white-pulse h-full">
      <div className="flex items-center gap-4 animate-pulse">
        <div className="w-14 h-14 bg-white/5 rounded hex-clip" />
        <div className="h-8 w-32 bg-white/5 rounded" />
      </div>
      <div className="flex flex-col gap-4 mt-2 animate-pulse">
        <div className="mx-auto h-10 w-48 bg-white/5 rounded-lg" />
        <div className="h-24 w-full bg-black/40 rounded-xl border border-white/5" />
      </div>
    </div>
  );
}
