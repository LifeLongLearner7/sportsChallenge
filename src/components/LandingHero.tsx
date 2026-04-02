"use client";

import { useState } from "react";
import NextImage from "next/image";
import { Zap, Mail, Users, Info, Trophy } from "lucide-react";
import { MR_PREDICTO_AVATAR } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

interface LandingHeroProps {
  stats: {
    humanScore: string;
    aiScore: string;
    globalAccuracy: string;
    topPredictor: {
      screen_name: string;
      accuracy: number;
    };
  };
}

export default function LandingHero({ stats }: LandingHeroProps) {
  const [showInviteInfo, setShowInviteInfo] = useState(false);
  const { topPredictor } = stats;

  return (
    <div className="flex flex-col gap-8 order-2 lg:order-1 relative">

      <div className="flex flex-col gap-4">
        <span className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/30 text-secondary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase w-fit">
          <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#ff6b98] animate-pulse"></span>
          Live: Human vs AI Epoch 1
        </span>
        <h1 className="font-headline text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase italic">
          Join the <br/><span className="text-primary italic">Synthetic</span> <br/>
          <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Arena</span>
        </h1>
        <p className="max-w-md text-on-surface-variant text-lg leading-relaxed">
          Experience the high-velocity fusion of T20 energy and futuristic AI precision. Predict outcomes, master the meta, and claim your status.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Action Belt: Join Button & Evidence */}
        <div className="flex flex-col gap-4 relative">
          <div className="flex flex-wrap gap-4 items-center">
            <button 
              onClick={() => setShowInviteInfo(!showInviteInfo)}
              className="px-8 py-4 bg-gradient-to-br from-primary to-primary-dim text-slate-950 font-headline font-extrabold uppercase tracking-widest rounded-md scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(129,236,255,0.4)] hover:shadow-[0_0_30px_rgba(129,236,255,0.6)] cursor-pointer"
            >
              Join the Arena
            </button>
            <div className="flex -space-x-3 items-center ml-4 relative">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 bg-surface-container-highest rounded-full border-2 border-surface hex-clip overflow-hidden">
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">U{i}</div>
                </div>
              ))}
              <div className="w-10 h-10 bg-surface-container-highest rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-primary bg-primary/20">
                12K+
              </div>
            </div>
          </div>
          
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 overflow-hidden whitespace-nowrap opacity-70">
             Thousands of humans are already predicting...
          </div>

        </div>



        <AnimatePresence>

          {showInviteInfo && (
            <motion.div 
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4 shadow-2xl relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Info size={40} className="text-primary" />
                </div>
                <div className="flex items-center gap-3 text-primary">
                  <Users size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest italic">Strategic Enrollment Protocol</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  Access to the Synthetic Arena is restricted to verified strategists. To request clearance:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-xs text-slate-400 font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Connect with an existing member for an Invitation Link.
                  </li>
                  <li className="flex items-center gap-3 text-xs text-slate-400 font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="flex items-center gap-2">
                       Email Command: <span className="text-primary cursor-pointer hover:underline">sportsaichallenge@gmail.com</span>
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feature Grid - Responsive based on screen width */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
        {/* Card 1: Mr. Predicto (Primary Rivalry) */}
        <div className="p-8 glass-panel rounded-2xl flex flex-col gap-4 group hover:bg-surface-container-high transition-all border-white/5 hover:border-secondary/30">
          <div className="relative w-12 h-12 hex-clip border border-secondary/30 shadow-[0_0_20px_rgba(255,107,152,0.4)] overflow-hidden">
             <NextImage 
               src={MR_PREDICTO_AVATAR.path!} 
               fill 
               sizes="48px"
               className="object-cover" 
               alt="Mr. Predicto" 
             />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-headline font-black text-2xl uppercase tracking-tighter italic text-white flex items-center gap-2">
              MR. <span className="text-secondary">PREDICTO</span>
            </h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Beat our AI rival - an advanced ML model architected for high-accuracy sports foresight.
            </p>
          </div>
        </div>

        {/* Card 2: Top Predictor (Human Elite) */}
        <div className="p-8 glass-panel rounded-2xl flex flex-col gap-5 group hover:bg-surface-container-high transition-all border-white/5 hover:border-primary/30">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center hex-clip shadow-[0_0_20px_rgba(129,236,255,0.2)]">
                 <Trophy className="text-primary" size={24} />
              </div>
              <h3 className="font-headline font-black text-2xl uppercase tracking-tighter italic text-white/50">
                 TOP <span className="text-primary/70">PREDICTOR</span>
              </h3>
           </div>

           <div className="flex flex-col gap-1">
              <div className="w-full text-center text-primary font-headline font-black uppercase text-3xl italic tracking-tighter drop-shadow-[0_0_12px_rgba(129,236,255,0.7)] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                 {topPredictor?.screen_name || "STRIKER_X"}
              </div>
              
              <div className="mt-4 bg-black/60 rounded-xl p-4 border border-white/5 shadow-inner flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">Current Win Rate</span>
                    <span className="text-lg font-headline font-black text-white italic leading-none">{topPredictor?.accuracy || 0}%</span>
                 </div>
                 <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px] relative">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${topPredictor?.accuracy || 0}%` }}
                       transition={{ delay: 0.5, duration: 2, ease: "circOut" }}
                       className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary-dim rounded-full shadow-[0_0_15px_rgba(129,236,255,0.4)]"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Card 3: Live Insights (Foundation) */}
        <div className="p-8 glass-panel rounded-2xl flex flex-col gap-4 group hover:bg-surface-container-high transition-all border-white/5 sm:col-span-2">
          <Zap className="text-primary-dim group-hover:text-primary transition-colors" size={32} />
          <div className="flex flex-col gap-1">
            <h3 className="font-headline font-bold text-xl uppercase tracking-tight text-slate-300">LIVE INSIGHTS</h3>
            <p className="text-xs text-on-surface-variant max-w-xl">
              Streaming real-time telemetry from active arenas. Power your predictions with raw, uncurated data feeds directly from the source.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
