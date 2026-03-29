"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LayoutDashboard, Sword, User, Bell, Wallet, Shield, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-actions";
import { Profile } from "@/types";
import { AVATARS } from "@/lib/constants";

const navItems = [
  { name: "Matches", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Arena", href: "/arena", icon: Sword },
  { name: "Profile", href: "/profile", icon: User },
];

export default function Navbar({ isAdmin, profile }: { isAdmin?: boolean, profile?: Profile | null }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectedAvatar = AVATARS.find(a => a.id === profile?.avatar_url) || AVATARS[0];

  const items = isAdmin 
    ? [...navItems, { name: "Admin", href: "/admin", icon: Shield }] 
    : navItems;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl border-b border-cyan-500/15 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex justify-between items-center relative">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 relative group-hover:scale-110 transition-transform">
              <Image src="/logo.png" alt="Logo" fill priority className="object-contain filter drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" sizes="32px" />
            </div>
            <span className="text-2xl font-black italic tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] font-headline uppercase leading-none">
              CYBER-SPORTS
            </span>
          </Link>
          
          <div className="hidden md:flex gap-6 font-headline tracking-tight font-bold text-sm uppercase">
            {items.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-cyan-200",
                  pathname === item.href ? "text-primary border-b-2 border-primary pb-1" : "text-slate-400"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => signOut()}
              className="text-slate-400 hover:bg-red-500/10 hover:text-red-400 p-2 rounded-lg transition-all group relative"
              title="Disconnect Session"
            >
              <LogOut size={20} />
              <span className="absolute -bottom-8 right-0 bg-slate-900 text-red-500 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-red-500/20 shadow-xl">
                Logout
              </span>
            </button>
            
            <Link 
              href="/profile"
              className="w-10 h-10 rounded-full bg-surface-container-highest border border-primary/20 p-0.5 overflow-hidden hex-clip hover:border-primary/50 hover:bg-primary/10 transition-all group/avatar relative"
              title="View Strategic Dossier"
            >
               <div className={cn("w-full h-full flex items-center justify-center transition-colors shadow-inner relative overflow-hidden", !selectedAvatar.path && selectedAvatar.bg, "group-hover/avatar:bg-primary/20")}>
                  {selectedAvatar.path ? (
                    <Image 
                      src={selectedAvatar.path} 
                      alt={selectedAvatar.name}
                      fill
                      priority
                      sizes="40px"
                      className="object-cover transition-transform group-hover/avatar:scale-110"
                    />
                  ) : selectedAvatar.icon ? (
                    (() => {
                      const Icon = selectedAvatar.icon;
                      return <Icon size={20} className={cn("transition-transform group-hover/avatar:scale-110", selectedAvatar.color)} />;
                    })()
                  ) : null}
               </div>
            </Link>
          </div>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden text-slate-400 hover:text-primary p-2 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-950/95 backdrop-blur-3xl border-b border-cyan-500/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col pt-2 pb-6 px-6 gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2 font-headline tracking-tight font-bold text-lg uppercase border-b border-white/5 pb-4">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    pathname === item.href ? "bg-primary/10 text-primary border border-primary/20" : "text-slate-400 hover:bg-white/5"
                  )}
                >
                  <Icon size={20} className={pathname === item.href ? "text-primary" : "text-slate-500"} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-2 pt-2">
            <Link 
              href="/profile" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-primary/20 p-0.5 overflow-hidden hex-clip transition-colors group-hover:bg-primary/10 group-hover:border-primary/50 relative">
                 <div className={cn("w-full h-full flex items-center justify-center shadow-inner relative overflow-hidden", !selectedAvatar.path && selectedAvatar.bg)}>
                    {selectedAvatar.path ? (
                      <Image src={selectedAvatar.path} alt={selectedAvatar.name} fill sizes="40px" className="object-cover" />
                    ) : selectedAvatar.icon ? (
                      (() => {
                        const Icon = selectedAvatar.icon;
                        return <Icon size={20} className={selectedAvatar.color} />;
                      })()
                    ) : null}
                 </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Logged in as</span>
                <span className="text-sm font-headline font-black text-white italic uppercase group-hover:text-primary transition-colors">{profile?.screen_name || "STRATEGIST"}</span>
              </div>
            </Link>
            
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
