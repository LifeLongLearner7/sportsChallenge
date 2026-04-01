import { User, Zap, Shield, Cpu, Gamepad2, Ghost, Rocket, Smile, Eye, type LucideIcon } from "lucide-react";

export interface AvatarOption {
  id: string;
  name: string;
  icon?: LucideIcon;
  path?: string;
  color: string;
  bg: string;
  glow: string;
}

export const AVATARS: AvatarOption[] = [
  { id: "neural_ace", name: "Neural Ace", path: "/assets/avatars/neural_ace.png", color: "text-primary", bg: "bg-primary/20", glow: "shadow-[0_0_20px_rgba(129,236,255,0.4)]" },
  { id: "synth_striker", name: "Synth Striker", path: "/assets/avatars/synth_striker.png", color: "text-secondary", bg: "bg-secondary/20", glow: "shadow-[0_0_20px_rgba(255,107,152,0.4)]" },
  { id: "glitch_vanguard", name: "Glitch Vanguard", path: "/assets/avatars/glitch_vanguard.png", color: "text-tertiary", bg: "bg-tertiary/20", glow: "shadow-[0_0_20px_rgba(184,107,255,0.4)]" },
  { id: "alpha_centurion", name: "Alpha Centurion", path: "/assets/avatars/alpha_centurion.png", color: "text-primary", bg: "bg-primary/20", glow: "shadow-[0_0_20px_rgba(129,236,255,0.4)]" },
  { id: "neon_batsman", name: "Neon Batsman", path: "/assets/avatars/neon_batsman.png", color: "text-secondary", bg: "bg-secondary/20", glow: "shadow-[0_0_20px_rgba(255,107,152,0.4)]" },
  { id: "circuit_samurai", name: "Circuit Samurai", path: "/assets/avatars/circuit_samurai.png", color: "text-tertiary", bg: "bg-tertiary/20", glow: "shadow-[0_0_20px_rgba(184,107,255,0.4)]" },
  { id: "data_drifter", name: "Data Drifter", path: "/assets/avatars/data_drifter.png", color: "text-white", bg: "bg-white/20", glow: "shadow-[0_0_20px_rgba(255,255,255,0.2)]" },
  { id: "pulse_architect", name: "Pulse Architect", path: "/assets/avatars/pulse_architect.png", color: "text-primary", bg: "bg-primary/20", glow: "shadow-[0_0_30px_rgba(129,236,255,0.5)]" },
];

export const MR_PREDICTO_AVATAR: AvatarOption = {
  id: "mr_predicto",
  name: "Mr. Predicto",
  path: "/assets/avatars/mr_predicto_v2.png",
  color: "text-secondary",
  bg: "bg-secondary/20",
  glow: "shadow-[0_0_30px_rgba(255,107,152,0.6)]"
};

export const ALPHA_HUMAN_AVATAR: AvatarOption = {
  id: "alpha_human",
  name: "Alpha Strategist",
  path: "/assets/avatars/alpha_human.png",
  color: "text-primary",
  bg: "bg-primary/20",
  glow: "shadow-[0_0_30px_rgba(129,236,255,0.6)]"
};

export const FACTIONS: AvatarOption[] = [
  { id: "fct_rcb", name: "Faction RCB", path: "/assets/avatars/fct_rcb.png", color: "text-red-500", bg: "bg-red-500/20", glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]" },
  { id: "fct_mi", name: "Faction MI", path: "/assets/avatars/fct_mi.png", color: "text-blue-500", bg: "bg-blue-500/20", glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]" },
  { id: "fct_csk", name: "Faction CSK", path: "/assets/avatars/fct_csk.png", color: "text-yellow-500", bg: "bg-yellow-500/20", glow: "shadow-[0_0_20px_rgba(234,179,8,0.4)]" },
  { id: "fct_kkr", name: "Faction KKR", path: "/assets/avatars/fct_kkr.png", color: "text-purple-500", bg: "bg-purple-500/20", glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]" },
];

export const TEAM_LOGOS: Record<string, string> = {
  "RCB": "/assets/teams/rcb.png",
  "SRH": "/assets/teams/srh.png",
  "MI": "/assets/teams/mi.png",
  "CSK": "/assets/teams/csk.png",
  "KKR": "/assets/teams/kkr.png",
  "DC": "/assets/teams/dc.png",
  "PBKS": "/assets/teams/pbks.png",
  "GT": "/assets/teams/gt.png",
  "LSG": "/assets/teams/lsg.png",
  "RR": "/assets/teams/rr.png"
};

export const ALL_IDENTITIES = [...AVATARS, ...FACTIONS, MR_PREDICTO_AVATAR];
