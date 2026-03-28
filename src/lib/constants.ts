import { User, Zap, Shield, Cpu, Gamepad2, Ghost, Rocket, Smile, Eye, type LucideIcon } from "lucide-react";

export interface AvatarOption {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  glow: string;
}

export const AVATARS: AvatarOption[] = [
  { id: "vanguard", name: "The Vanguard", icon: Shield, color: "text-primary", bg: "bg-primary/10", glow: "shadow-[0_0_20px_rgba(255,107,152,0.4)]" },
  { id: "striker", name: "Neon Striker", icon: Zap, color: "text-secondary", bg: "bg-secondary/10", glow: "shadow-[0_0_20px_rgba(129,236,255,0.4)]" },
  { id: "glitch", name: "Glitch Hunter", icon: Ghost, color: "text-tertiary", bg: "bg-tertiary/10", glow: "shadow-[0_0_20px_rgba(184,107,255,0.4)]" },
  { id: "pilot", name: "Core Pilot", icon: Rocket, color: "text-primary", bg: "bg-primary/10", glow: "shadow-[0_0_20px_rgba(255,107,152,0.4)]" },
  { id: "android", name: "Neural-01", icon: Cpu, color: "text-secondary", bg: "bg-secondary/10", glow: "shadow-[0_0_20px_rgba(129,236,255,0.4)]" },
  { id: "gamer", name: "Pro Gamer", icon: Gamepad2, color: "text-white", bg: "bg-white/10", glow: "shadow-[0_0_20px_rgba(255,255,255,0.2)]" },
  { id: "observer", name: "The Observer", icon: Eye, color: "text-tertiary", bg: "bg-tertiary/10", glow: "shadow-[0_0_20px_rgba(184,107,255,0.4)]" },
  { id: "sentinel", name: "Arena Sentinel", icon: User, color: "text-primary", bg: "bg-primary/10", glow: "shadow-[0_0_20px_rgba(255,107,152,0.4)]" },
  { id: "optimist", name: "Digital Soul", icon: Smile, color: "text-secondary", bg: "bg-secondary/10", glow: "shadow-[0_0_20px_rgba(129,236,255,0.4)]" },
];
