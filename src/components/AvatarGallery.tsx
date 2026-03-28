"use client";

import { useState } from "react";
import { AVATARS } from "@/lib/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export default function AvatarGallery({ 
  onSelect, 
  currentId 
}: { 
  onSelect: (id: string) => void, 
  currentId?: string 
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-6">
      {AVATARS.map((avatar) => {
        const Icon = avatar.icon;
        const isSelected = currentId === avatar.id;
        
        return (
          <button
            key={avatar.id}
            onClick={() => onSelect(avatar.id)}
            className={cn(
              "relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group overflow-hidden border-2",
              isSelected 
                ? cn("border-white bg-white/10", avatar.glow) 
                : "border-white/5 bg-black/40 hover:border-white/20 hover:bg-white/5"
            )}
          >
            {/* Background Texture Effect */}
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
               <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
               <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
            </div>

            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
              avatar.bg,
              avatar.color
            )}>
              <Icon size={24} />
            </div>
            
            <span className={cn(
              "text-[9px] font-black uppercase tracking-tighter transition-colors",
              isSelected ? "text-white" : "text-slate-500 group-hover:text-slate-300"
            )}>
              {avatar.name}
            </span>

            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}
