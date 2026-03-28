"use client";

import { AvatarOption } from "@/lib/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AvatarGallery({ 
  onSelect, 
  currentId,
  options
}: { 
  onSelect: (id: string) => void, 
  currentId?: string,
  options: AvatarOption[]
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {options.map((avatar) => {
        const isSelected = currentId === avatar.id;
        const Icon = avatar.icon;
        
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.id)}
            className={cn(
              "relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden border-2",
              isSelected 
                ? cn("border-white/40 bg-white/10", avatar.glow) 
                : "border-white/5 bg-black/40 hover:border-white/20 hover:bg-white/5"
            )}
          >
            {/* Show-Stopper Image or Icon Fallback */}
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110 overflow-hidden relative",
              !avatar.path && avatar.bg,
              !avatar.path && avatar.color
            )}>
              {avatar.path ? (
                <>
                  <img 
                    src={avatar.path} 
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Glass overlay on image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </>
              ) : Icon ? (
                <Icon size={32} />
              ) : null}
            </div>
            
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest transition-colors text-center px-1",
              isSelected ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
            )}>
              {avatar.name}
            </span>

            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#81ecff]"></div>
            )}
            
            {/* Active Link Animation */}
            {isSelected && (
              <div className="absolute inset-0 border-2 border-primary animate-pulse opacity-20 pointer-events-none rounded-2xl"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}
