"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { X, Trophy, Shield, Target, Users, TrendingUp, Star, Dumbbell } from "lucide-react";
import { FIFA_TEAM_LOGOS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Player {
  name: string;
  position: string;
  dateOfBirth: string;
  nationality: string;
}

interface Standing {
  group: string;
  position: number;
  points: number;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface RecentResult {
  opponent: string;
  opponentName: string;
  myGoals: number;
  theirGoals: number;
  result: "W" | "D" | "L";
  date: string;
}

interface TeamProfile {
  teamCode: string;
  fullName: string;
  coachName: string | null;
  coachNationality: string | null;
  founded: number | null;
  clubColors: string | null;
  crestUrl: string | null;
  players: Player[];
  standing: Standing | null;
  recentResults: RecentResult[];
}

interface TeamProfileModalProps {
  teamCode: string | null;
  onClose: () => void;
}

const POSITION_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  "Goalkeeper": { label: "GK", color: "text-yellow-300", bgColor: "bg-yellow-500/20 border-yellow-500/40", icon: "🧤" },
  "Defence":    { label: "DEF", color: "text-blue-300",   bgColor: "bg-blue-500/20 border-blue-500/40",    icon: "🛡️" },
  "Midfield":   { label: "MID", color: "text-green-300",  bgColor: "bg-green-500/20 border-green-500/40",  icon: "⚙️" },
  "Offence":    { label: "FWD", color: "text-red-300",    bgColor: "bg-red-500/20 border-red-500/40",      icon: "⚡" },
};

function getAge(dob: string): number {
  const born = new Date(dob);
  const now = new Date();
  return Math.floor((now.getTime() - born.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function ResultBadge({ result, opponent, myGoals, theirGoals }: { result: "W" | "D" | "L"; opponent: string; myGoals: number; theirGoals: number }) {
  const styles = {
    W: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
    D: "bg-amber-500/20 border-amber-500/50 text-amber-300",
    L: "bg-red-500/20 border-red-500/50 text-red-300",
  };
  const flagUrl = FIFA_TEAM_LOGOS[opponent];

  return (
    <div className={cn("group relative flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border backdrop-blur-sm transition-all cursor-default", styles[result])}>
      {flagUrl && (
        <div className="relative w-6 h-4 rounded-sm overflow-hidden flex-shrink-0">
          <Image src={flagUrl} fill sizes="24px" className="object-cover" alt={opponent} />
        </div>
      )}
      <span className="text-[11px] font-black tracking-wider">{result}</span>
      <span className="text-[9px] font-bold opacity-70">{myGoals}–{theirGoals}</span>
      {/* Tooltip */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white/10">
        vs {opponent}
      </div>
    </div>
  );
}

export default function TeamProfileModal({ teamCode, onClose }: TeamProfileModalProps) {
  const [profile, setProfile] = useState<TeamProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const res = await fetch(`/api/team-profile/${code}`);
      if (!res.ok) throw new Error("Failed to load team data");
      const data = await res.json();
      setProfile(data);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (teamCode) fetchProfile(teamCode);
  }, [teamCode, fetchProfile]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!teamCode) return null;

  const flagUrl = FIFA_TEAM_LOGOS[teamCode];
  const p = profile;

  const totalGoals = p?.standing ? p.standing.goalsFor + p.standing.goalsAgainst : 0;
  const scoredPct = totalGoals > 0 && p?.standing ? (p.standing.goalsFor / totalGoals) * 100 : 50;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0a0a0f] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* ── HERO SECTION ─────────────────────────────────────────────── */}
        <div className="relative h-52 sm:h-64 overflow-hidden rounded-t-3xl sm:rounded-t-3xl flex-shrink-0">
          {/* Flag as blurred background */}
          {flagUrl && (
            <>
              <Image
                src={flagUrl}
                fill
                sizes="800px"
                className="object-cover scale-110 blur-sm brightness-40"
                alt=""
                aria-hidden
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#0a0a0f]" />
            </>
          )}
          {!flagUrl && <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
            aria-label="Close"
          >
            <X size={14} />
          </button>

          {/* Hero content */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-6 text-center">
            {/* Flag + Crest side by side */}
            <div className="flex items-center gap-4 mb-3">
              {flagUrl && (
                <div className="relative w-16 h-11 rounded-md overflow-hidden border-2 border-white/20 shadow-xl flex-shrink-0">
                  <Image src={flagUrl} fill sizes="64px" className="object-cover" alt={teamCode} />
                </div>
              )}
              {p?.crestUrl && (
                <div className="relative w-12 h-12 flex-shrink-0 drop-shadow-2xl">
                  <Image src={p.crestUrl} fill sizes="48px" className="object-contain" alt="crest" />
                </div>
              )}
            </div>
            {loading ? (
              <div className="h-8 w-40 bg-white/10 rounded-lg animate-pulse mb-1" />
            ) : (
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-lg">
                {p?.fullName || teamCode}
              </h2>
            )}
            {p?.coachName && (
              <p className="text-[11px] font-semibold text-white/50 uppercase tracking-widest mt-1">
                Coach: {p.coachName}
                {p.coachNationality && <span className="text-white/30"> · {p.coachNationality}</span>}
              </p>
            )}
          </div>
        </div>

        {/* ── BODY ─────────────────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-8 pt-2 space-y-6">

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-3 gap-3">
                {[0,1,2].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
              </div>
              <div className="h-16 bg-white/5 rounded-2xl" />
              <div className="h-24 bg-white/5 rounded-2xl" />
              <div className="grid grid-cols-3 gap-3">
                {[0,1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
              </div>
            </div>
          )}

          {error && (
            <div className="py-10 text-center text-red-400/70 font-mono text-sm">
              ⚠ {error}
            </div>
          )}

          {p && !loading && (
            <>
              {/* ── STAT CHIPS ─────────────────────────────────────────── */}
              {p.standing && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl py-4 px-3">
                    <Trophy size={16} className="text-amber-400" />
                    <span className="text-xl font-black text-white">{p.standing.position}</span>
                    <span className="text-[9px] uppercase tracking-widest text-amber-400/80 font-bold">Group Rank</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-2xl py-4 px-3">
                    <Star size={16} className="text-primary" />
                    <span className="text-xl font-black text-white">{p.standing.points}</span>
                    <span className="text-[9px] uppercase tracking-widest text-primary/80 font-bold">Points</span>
                  </div>
                  <div className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl py-4 px-3 border",
                    (p.standing.goalsFor - p.standing.goalsAgainst) >= 0
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  )}>
                    <TrendingUp size={16} className={(p.standing.goalsFor - p.standing.goalsAgainst) >= 0 ? "text-emerald-400" : "text-red-400"} />
                    <span className="text-xl font-black text-white">
                      {p.standing.goalsFor - p.standing.goalsAgainst >= 0 ? "+" : ""}
                      {p.standing.goalsFor - p.standing.goalsAgainst}
                    </span>
                    <span className={cn("text-[9px] uppercase tracking-widest font-bold",
                      (p.standing.goalsFor - p.standing.goalsAgainst) >= 0 ? "text-emerald-400/80" : "text-red-400/80"
                    )}>Goal Diff</span>
                  </div>
                </div>
              )}

              {/* ── W/D/L ROW ────────────────────────────────────────────── */}
              {p.standing && (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={13} className="text-white/50" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">
                      {p.standing.group.replace("_", " ")} · {p.standing.played} Games Played
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-black text-emerald-400">{p.standing.won}</div>
                      <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Won</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-amber-400">{p.standing.draw}</div>
                      <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Draw</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-red-400">{p.standing.lost}</div>
                      <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Lost</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── GOALS BAR ────────────────────────────────────────────── */}
              {p.standing && totalGoals > 0 && (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={13} className="text-white/50" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">Goals Overview</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-400">Scored: {p.standing.goalsFor}</span>
                    <span className="text-[11px] font-bold text-red-400">Conceded: {p.standing.goalsAgainst}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                      style={{ width: `${scoredPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[8px] text-emerald-500/60 font-mono">ATTACK</span>
                    <span className="text-[8px] text-red-500/60 font-mono">CONCEDED</span>
                  </div>
                </div>
              )}

              {/* ── RECENT FORM ───────────────────────────────────────────── */}
              {p.recentResults.length > 0 && (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={13} className="text-white/50" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">
                      Last {p.recentResults.length} WC Results
                    </span>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {p.recentResults.map((r, i) => (
                      <ResultBadge
                        key={i}
                        result={r.result}
                        opponent={r.opponent}
                        myGoals={r.myGoals}
                        theirGoals={r.theirGoals}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── KEY PLAYERS ───────────────────────────────────────────── */}
              {p.players.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={13} className="text-white/50" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">Key Players</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {p.players.map((player, i) => {
                      const pos = POSITION_CONFIG[player.position] || POSITION_CONFIG["Midfield"];
                      const age = player.dateOfBirth ? getAge(player.dateOfBirth) : null;
                      return (
                        <div
                          key={i}
                          className="bg-white/3 border border-white/8 rounded-xl p-3 flex flex-col gap-2 hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider", pos.bgColor, pos.color)}>
                              {pos.icon} {pos.label}
                            </span>
                            {age && (
                              <span className="text-[9px] text-white/30 font-mono">{age}y</span>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-white leading-tight">
                              {player.name.split(" ").slice(-1)[0]}
                            </p>
                            <p className="text-[9px] text-white/40 leading-tight">
                              {player.name.split(" ").slice(0, -1).join(" ")}
                            </p>
                          </div>
                          {player.nationality && (
                            <p className="text-[8px] text-white/25 uppercase tracking-wider truncate">
                              {player.nationality}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── FOOTER ─────────────────────────────────────────────────── */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {p.founded && (
                    <span className="text-[9px] text-white/20 font-mono">Est. {p.founded}</span>
                  )}
                  {p.clubColors && (
                    <span className="text-[9px] text-white/20 font-mono truncate max-w-[150px]">{p.clubColors}</span>
                  )}
                </div>
                <span className="text-[8px] text-white/15 font-mono uppercase tracking-widest">football-data.org</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
