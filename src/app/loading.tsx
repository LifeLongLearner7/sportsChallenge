"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center gap-8">
      {/* Neural Pulse Core */}
      <div className="relative w-24 h-24">
        {/* Outer Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary shadow-[0_0_20px_rgba(129,236,255,0.2)]"
        />
        
        {/* Inner Pulsing Core */}
        <motion.div 
          animate={{ 
            scale: [0.8, 1.1, 0.8],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-4 rounded-full bg-primary/20 flex items-center justify-center"
        >
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_15px_#81ecff]" />
        </motion.div>

        {/* Tactical Scan Line */}
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-px bg-primary/40 shadow-[0_0_10px_#81ecff] opacity-50"
        />
      </div>

      {/* Protocol Status */}
      <div className="flex flex-col items-center gap-2">
        <h2 className="font-headline font-black italic text-xl tracking-[0.2em] text-white opacity-80 uppercase">
          SYNCHRONIZING <span className="text-primary italic animate-pulse">ARENA</span>
        </h2>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div 
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1 h-1 rounded-full bg-primary"
            />
          ))}
        </div>
      </div>

      <p className="text-[10px] font-bold tracking-[0.3em] text-slate-600 uppercase">
        Initializing High-Altitude Neural Logic
      </p>
    </div>
  );
}
