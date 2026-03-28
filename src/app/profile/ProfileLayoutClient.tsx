"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Settings, Shield, Zap } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Profile } from "@/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProfileLayoutClient({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile | null;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Strategic Dossier", href: "/profile", icon: User },
    { name: "Neural Settings", href: "/profile/settings", icon: Settings },
  ];

  return (
    <main className="min-h-screen bg-background pt-32 pb-12 px-6">
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 relative z-10 transition-all">
        {/* Profile Side Navigation */}
        <aside className="w-full md:w-64 flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-2xl flex flex-col gap-2 border-primary/10">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-2">Neural Interface</h3>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-[11px] tracking-wider group",
                    isActive 
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,107,152,0.2)]" 
                      : "text-on-surface-variant hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={16} className={cn("transition-colors", isActive ? "text-primary" : "text-slate-500 group-hover:text-primary")} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 border-secondary/10 hidden md:flex">
             <div className="flex items-center gap-3">
                <Shield size={16} className="text-secondary" />
                <span className="text-[10px] font-black text-white uppercase italic">Security Grade: A</span>
             </div>
             <div className="flex items-center gap-3">
                <Zap size={16} className="text-tertiary" />
                <span className="text-[10px] font-black text-white uppercase italic">Sync Rate: 98%</span>
             </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </main>
  );
}
