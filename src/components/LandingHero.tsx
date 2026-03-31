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

          {/* Top Predictor Highlight Card - Anchored to action belt on desktop, flows below on mobile */}
          <div className="mt-6 lg:mt-0 relative lg:absolute lg:left-full lg:ml-12 lg:top-1/2 lg:-translate-y-1/2 z-20 pointer-events-none w-full sm:w-80 lg:w-64">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0, rotate: -6 }}
              transition={{ delay: 0.8, duration: 1, type: "spring" }}
              className="glass-panel p-5 rounded-2xl border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 border-r border-b border-primary/10"
            >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-secondary/10 border border-secondary/30 flex items-center justify-center relative shadow-[0_0_20px_rgba(255,107,152,0.15)]" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}>
                      <div className="absolute inset-0 bg-secondary/20 animate-pulse" style={{ clipPath: 'inherit' }}></div>
                      <Trophy size={20} className="text-secondary relative z-10" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-1">Top Predictor</span>
                      <span className="text-base font-headline font-black text-white italic uppercase tracking-tighter drop-shadow-sm truncate max-w-[120px]">
                        {topPredictor?.screen_name || "STRIKER_X"}
                      </span>
                  </div>
                </div>
                
                <div className="bg-black/60 rounded-xl p-3 border border-white/5 shadow-inner">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black text-primary/80 uppercase tracking-widest leading-none">Current Win Rate</span>
                      <span className="text-sm font-headline font-black text-white italic">{topPredictor?.accuracy || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${topPredictor?.accuracy || 0}%` }}
                        transition={{ delay: 1.5, duration: 2, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-primary/40 to-primary rounded-full shadow-[0_0_15px_rgba(129,236,255,0.5)]"
                      ></motion.div>
                  </div>
                </div>
            </motion.div>
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

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="p-6 glass-panel rounded-xl flex flex-col gap-2 group hover:bg-surface-container-high transition-colors">
          <Zap className="text-primary" size={32} />
          <h3 className="font-headline font-bold text-lg uppercase tracking-tight">LIVE INSIGHTS</h3>
          <p className="text-xs text-on-surface-variant">Real-time data powering your predictions</p>
        </div>
        <div className="p-6 glass-panel rounded-xl flex flex-col gap-2 group hover:bg-surface-container-high transition-colors">
          <div className="relative w-8 h-8 hex-clip border border-secondary/30 shadow-[0_0_15px_rgba(255,107,152,0.4)] overflow-hidden">
             <NextImage src={MR_PREDICTO_AVATAR.path!} fill className="object-cover" alt="Mr. Predicto" />
          </div>
          <h3 className="font-headline font-bold text-lg uppercase tracking-tight">MR. PREDICTO</h3>
          <p className="text-xs text-on-surface-variant">Beat our AI rival — powered by GPT‑4o neural analysis.</p>
        </div>
      </div>
    </div>
  );
}
