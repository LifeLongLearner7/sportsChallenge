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

export const FIFA_TEAM_LOGOS: Record<string, string> = {
  "ARG": "https://flagcdn.com/w160/ar.png",
  "AUS": "https://flagcdn.com/w160/au.png",
  "BEL": "https://flagcdn.com/w160/be.png",
  "BRA": "https://flagcdn.com/w160/br.png",
  "CAN": "https://flagcdn.com/w160/ca.png",
  "CMR": "https://flagcdn.com/w160/cm.png",
  "CRC": "https://flagcdn.com/w160/cr.png",
  "CRO": "https://flagcdn.com/w160/hr.png",
  "DEN": "https://flagcdn.com/w160/dk.png",
  "ECU": "https://flagcdn.com/w160/ec.png",
  "ENG": "https://flagcdn.com/w160/gb-eng.png",
  "ESP": "https://flagcdn.com/w160/es.png",
  "FRA": "https://flagcdn.com/w160/fr.png",
  "GER": "https://flagcdn.com/w160/de.png",
  "GHA": "https://flagcdn.com/w160/gh.png",
  "IRN": "https://flagcdn.com/w160/ir.png",
  "JPN": "https://flagcdn.com/w160/jp.png",
  "KOR": "https://flagcdn.com/w160/kr.png",
  "KSA": "https://flagcdn.com/w160/sa.png",
  "MAR": "https://flagcdn.com/w160/ma.png",
  "MEX": "https://flagcdn.com/w160/mx.png",
  "NED": "https://flagcdn.com/w160/nl.png",
  "NGA": "https://flagcdn.com/w160/ng.png",
  "POR": "https://flagcdn.com/w160/pt.png",
  "POL": "https://flagcdn.com/w160/pl.png",
  "QAT": "https://flagcdn.com/w160/qa.png",
  "SEN": "https://flagcdn.com/w160/sn.png",
  "SRB": "https://flagcdn.com/w160/rs.png",
  "SUI": "https://flagcdn.com/w160/ch.png",
  "TUN": "https://flagcdn.com/w160/tn.png",
  "URU": "https://flagcdn.com/w160/uy.png",
  "USA": "https://flagcdn.com/w160/us.png",
  "WAL": "https://flagcdn.com/w160/gb-wls.png",
  "PAN": "https://flagcdn.com/w160/pa.png",
  "ALB": "https://flagcdn.com/w160/al.png",
  "AUT": "https://flagcdn.com/w160/at.png",
  "CZE": "https://flagcdn.com/w160/cz.png",
  "GRE": "https://flagcdn.com/w160/gr.png",
  "HUN": "https://flagcdn.com/w160/hu.png",
  "IRL": "https://flagcdn.com/w160/ie.png",
  "NOR": "https://flagcdn.com/w160/no.png",
  "ROU": "https://flagcdn.com/w160/ro.png",
  "SCO": "https://flagcdn.com/w160/gb-sct.png",
  "SVK": "https://flagcdn.com/w160/sk.png",
  "SWE": "https://flagcdn.com/w160/se.png",
  "TUR": "https://flagcdn.com/w160/tr.png",
  "UKR": "https://flagcdn.com/w160/ua.png",
  "COL": "https://flagcdn.com/w160/co.png",
  "CHI": "https://flagcdn.com/w160/cl.png",
  "EGY": "https://flagcdn.com/w160/eg.png",
  "CIV": "https://flagcdn.com/w160/ci.png",
  "MLI": "https://flagcdn.com/w160/ml.png",
  "COD": "https://flagcdn.com/w160/cd.png",
  "ALG": "https://flagcdn.com/w160/dz.png",
  "NZL": "https://flagcdn.com/w160/nz.png",
  "FIJ": "https://flagcdn.com/w160/fj.png",
  "GAB": "https://flagcdn.com/w160/ga.png",
  "VEN": "https://flagcdn.com/w160/ve.png",
  "BOL": "https://flagcdn.com/w160/bo.png",
  "PER": "https://flagcdn.com/w160/pe.png",
  "PAR": "https://flagcdn.com/w160/py.png",
  "RSA": "https://flagcdn.com/w160/za.png",
  "SOU": "https://flagcdn.com/w160/za.png",
  "BIH": "https://flagcdn.com/w160/ba.png",
  "BOS": "https://flagcdn.com/w160/ba.png",
  "ITA": "https://flagcdn.com/w160/it.png",
  "ISL": "https://flagcdn.com/w160/is.png",
  "FIN": "https://flagcdn.com/w160/fi.png",
  "BUL": "https://flagcdn.com/w160/bg.png",
  "NIR": "https://flagcdn.com/w160/gb-nir.png",
  "ISR": "https://flagcdn.com/w160/il.png",
  "CAP": "https://flagcdn.com/w160/cv.png",
  "CPV": "https://flagcdn.com/w160/cv.png",
  "CUR": "https://flagcdn.com/w160/cw.png",
  "CUW": "https://flagcdn.com/w160/cw.png",
  "HAI": "https://flagcdn.com/w160/ht.png",
  "HTI": "https://flagcdn.com/w160/ht.png",
  "IRA": "https://flagcdn.com/w160/iq.png",
  "IRQ": "https://flagcdn.com/w160/iq.png",
  "JOR": "https://flagcdn.com/w160/jo.png",
  "UZB": "https://flagcdn.com/w160/uz.png",
};

export const ALL_IDENTITIES = [...AVATARS, ...FACTIONS, MR_PREDICTO_AVATAR];
