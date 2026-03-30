/**
 * THE NEURAL CORE: Strategist Progression Logic
 * Governs Levels, Tiers, and Sync Rates in the Cyber-Sports arena.
 */

export type StrategistTier = "NEURAL PRIME" | "GRANDMASTER" | "TACTICAL OVERLORD" | "CORE STRATEGIST" | "INITIATE";

export interface StrategistStatus {
  level: number;
  tier: StrategistTier;
  pulse: string;
  accuracy: number;
}

/**
 * Level Calculation (Exponential Curve)
 * Level 1: 0 points
 * Level 5: ~200 points
 * Level 20: ~1500 points
 * Level 50: ~5000 points
 */
export function calculateLevel(points: number): number {
  if (!points || points < 0) return 1;
  return Math.floor(Math.pow(points / 25, 0.7)) + 1;
}

/**
 * Tier Calculation (Percentile Based)
 */
export function calculateTier(rank: number, totalUsers: number): StrategistTier {
  if (rank === 1) return "NEURAL PRIME";
  if (totalUsers <= 0) return "INITIATE";

  const percentile = (rank / totalUsers) * 100;

  if (percentile <= 5) return "GRANDMASTER";
  if (percentile <= 15) return "TACTICAL OVERLORD";
  if (percentile <= 30) return "CORE STRATEGIST";
  return "INITIATE";
}

/**
 * Pulse Description (Mental State)
 */
export function calculatePulse(accuracy: number, matchesPredicted: number): string {
  if (matchesPredicted < 3) return "CALIBRATING";
  if (accuracy >= 90) return "OVERDRIVE";
  if (accuracy >= 70) return "STABLE";
  if (accuracy >= 50) return "SINC SPEED";
  return "NEURAL DRIFT";
}

/**
 * Get Tier Styling (Tailwind Classes)
 */
export function getTierColor(tier: StrategistTier): string {
  switch (tier) {
    case "NEURAL PRIME": return "text-purple-400 border-purple-500/30 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]";
    case "GRANDMASTER": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    case "TACTICAL OVERLORD": return "text-orange-400 border-orange-500/30 bg-orange-500/10";
    case "CORE STRATEGIST": return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    default: return "text-slate-400 border-white/10 bg-white/5";
  }
}
