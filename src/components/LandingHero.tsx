"use client";

import { useState } from "react";
import Image from "next/image";
import { Zap, Users, Info, Bot, Trophy, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LandingHeroProps {
  stats: {
    humanScore: string;
    aiScore: string;
    globalAccuracy: string;
  };
}

export default function LandingHero({ stats }: LandingHeroProps) {
  const [showInviteInfo, setShowInviteInfo] = useState(false);

  return (
    <div className="flex flex-col gap-10 relative">
      
      {/* Proposition Pulse */}
      <div className="flex flex-col gap-5">
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 bg-secondary/15 border border-secondary/30 text-secondary px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.4em] uppercase w-fit"
        >
          <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#ff6b98] animate-pulse"></span>
          Live: Human vs AI Epoch 1
        </motion.span>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-headline text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase italic"
        >
          Join the <br/>
          <span className="text-primary italic">Synthetic</span> <br/>
          <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">Arena</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-md text-slate-400 text-lg md:text-xl leading-relaxed font-medium"
        >
          Experience the high-velocity fusion of T20 energy and futuristic AI precision. Predict outcomes, master the meta, and claim your status.
        </motion.p>
      </div>

      {/* Action Pulse - Matches Expected Screenshot */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-5 items-center">
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInviteInfo(!showInviteInfo)}
              className="px-10 py-5 bg-gradient-to-br from-primary to-primary-dim text-slate-950 font-headline font-black uppercase tracking-widest text-sm rounded shadow-[0_0_30px_rgba(129,236,255,0.3)] hover:shadow-[0_0_40px_rgba(129,236,255,0.5)] transition-all"
            >
              Join the Arena
            </motion.button>
            
            <div className="flex -space-x-4 items-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-12 h-12 bg-slate-900 rounded-full border-2 border-[#050505] flex items-center justify-center text-primary text-[11px] font-black shadow-2xl">
                   U{i}
                </div>
              ))}
              <div className="w-12 h-12 bg-slate-800 rounded-full border-2 border-[#050505] flex items-center justify-center text-[10px] font-black text-primary bg-primary/20 z-10 shadow-2xl">
                12K+
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showInviteInfo && (
              <motion.div 
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 glass-panel rounded-2xl border-white/5 bg-white/5 shadow-2xl flex flex-col gap-4 relative group">
                  <div className="absolute top-4 right-4 text-white/5 group-hover:text-primary/20 transition-colors">
                    <Info size={48} />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Users className="text-primary" size={20} />
                    <h3 className="font-headline font-black text-sm uppercase tracking-[0.2em] italic text-primary">
                      STRATEGIC ENROLLMENT PROTOCOL
                    </h3>
                  </div>
                  
                  <p className="text-xs font-bold text-slate-300 leading-relaxed uppercase tracking-wider">
                    Access to the Synthetic Arena is restricted to verified strategists. To request clearance:
                  </p>
                  
                  <ul className="flex flex-col gap-3">
                    <li className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 group-hover/item:scale-125 transition-transform" />
                      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Connect with an existing member for an Invitation Link.
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 group-hover/item:scale-125 transition-transform" />
                      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Send Email to: <span className="text-primary cursor-pointer hover:underline">support@sportsaichallenge.com</span>
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex flex-col gap-3">
           <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent"></div>
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-1">Global Connectivity Confirmed • Thousands signaling...</span>
        </div>
      </div>
    </div>
  );
}
