"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import { getMatches, updateMatchWinner, triggerManualSync, getUserProfile } from "@/lib/data-actions";
import { Match, Profile } from "@/types";
import { useRouter } from "next/navigation";
import { 
  Trophy, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  Target, 
  ShieldAlert,
  Flame,
  Binary
} from "lucide-react";

/**
 * Tactical Command Center: Admin Match Management
 * Allows manual overrides and triggering the synchronization pulse.
 */
export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'info' | 'error' | 'success' } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const fetchMatches = useCallback(async () => {
    try {
      const data = await getMatches();
      setMatches(data);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const profile = await getUserProfile();
      if (!profile || !profile.is_admin) {
        console.warn("UNAUTHORIZED ACCESS: Neural link terminated.");
        router.push("/dashboard");
        return;
      }
      
      await fetchMatches();
      setLoading(false);
    }
    init();
  }, [router, fetchMatches]);



  const handleUpdateWinner = async (matchId: string, winnerKey: "team_a" | "team_b") => {
    setStatusMessage({ text: "Processing Tactical Resolution...", type: "info" });
    startTransition(async () => {
      try {
        await updateMatchWinner(matchId, winnerKey);
        await fetchMatches();
        setStatusMessage({ text: "Strategic Link Resolution Successful.", type: "success" });
      } catch (error) {
        setStatusMessage({ text: "Strategic Pulse Error: Resolution aborted.", type: "error" });
      }
    });
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setStatusMessage({ text: "Initiating Global Synchronization...", type: "info" });
    try {
      await triggerManualSync();
      await fetchMatches();
      setStatusMessage({ text: "Global System Pulse Complete.", type: "success" });
    } catch (error) {
      setStatusMessage({ text: "Critical Pulse Failure: Synchronization breached.", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const upcomingMatches = matches.filter(m => m.status !== "completed");
  const completedMatches = matches.filter(m => m.status === "completed");

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans selection:bg-purple-500/30">
      {/* HUD Header */}
      <header className="max-w-7xl mx-auto mb-8 border-b border-white/5 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.push("/admin")}
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors group"
          >
            <ShieldAlert className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            [ Return to Command Centre ]
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent flex items-center gap-3">
              <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
              TACTICAL COMMAND CENTER
            </h1>
            <p className="text-white/40 font-mono text-sm mt-2 uppercase tracking-[0.2em]">
              Administrative Override // Match Integration Protocol
            </p>
          </div>

          <div className="flex items-center gap-6">

          {statusMessage && (
            <div className={`text-[10px] font-mono uppercase tracking-[0.2em] px-4 py-2 border rounded-lg animate-in fade-in slide-in-from-right-2 ${
               statusMessage.type === 'error' ? 'text-red-500 border-red-500/20 bg-red-500/5' :
               statusMessage.type === 'success' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
               'text-blue-500 border-blue-500/20 bg-blue-500/5'
            }`}>
              {statusMessage.text}
            </div>
          )}
          
          <button 
            onClick={handleManualSync}
            disabled={syncing || isPending}
            className="relative group px-6 py-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span className="font-mono text-xs font-bold tracking-widest uppercase">Trigger Strategic Pulse</span>
            <div className="absolute inset-0 bg-white/5 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-full -z-10" />
          </button>
        </div>
      </div>
    </header>



      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Active Grid Control */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              ACTIVE GRID RESOLUTION
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-mono text-white/40 ml-2">
                {upcomingMatches.length} NODES
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {upcomingMatches.length === 0 ? (
              <div className="p-12 border border-white/5 rounded-3xl bg-white/[0.02] flex flex-col items-center justify-center text-center">
                <Binary className="w-12 h-12 text-white/10 mb-4" />
                <p className="text-white/20 font-mono text-xs uppercase tracking-widest">No Active Nodes Detected</p>
              </div>
            ) : upcomingMatches.map(match => (
              <div 
                key={match.id}
                className="group relative p-6 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm font-bold tracking-tight">{match.team_a}</p>
                      <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Host Team</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-[1px] bg-white/10" />
                      <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">VS</span>
                      <div className="w-8 h-[1px] bg-white/10" />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">{match.team_b}</p>
                      <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Opponent</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-mono text-white/60">
                      {new Date(match.match_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest flex items-center justify-end gap-1">
                      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                      Status: Upcoming
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={() => handleUpdateWinner(match.id, "team_a")}
                    disabled={isPending || syncing}
                    className="py-3 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Set {match.team_a} Winner
                  </button>
                  <button 
                    onClick={() => handleUpdateWinner(match.id, "team_b")}
                    disabled={isPending || syncing}
                    className="py-3 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Set {match.team_b} Winner
                  </button>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* Global Statistics & Context */}
        <section className="lg:col-span-4 space-y-8">
          <div className="p-8 border border-white/10 rounded-3xl bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[64px] rounded-full group-hover:bg-purple-500/20 transition-all" />
            
            <header className="flex items-center justify-between mb-8">
              <h3 className="font-bold tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                SYSTEM LOGS
              </h3>
            </header>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Flame className="w-5 h-5 text-orange-400 mt-1" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1 text-white/80">Manual Resolution</p>
                  <p className="text-[10px] leading-relaxed text-white/40 font-mono uppercase">
                    Use discrete override buttons to resolve match winners. This will trigger the scoring engine for all predictors instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Trophy className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1 text-white/80">Neural Scoring</p>
                  <p className="text-[10px] leading-relaxed text-white/40 font-mono uppercase">
                    Winners: +100 PTS<br />
                    Neural Override: +50 PTS<br />
                    (Human correct & AI wrong)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-mono text-white/20 uppercase tracking-[0.3em] pl-2">Resolved Archives</h3>
            <div className="space-y-2">
              {completedMatches.slice(0, 5).map(match => (
                <div key={match.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                  <p className="text-[10px] font-bold uppercase tracking-tight">{match.team_a} vs {match.team_b}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-white/30 uppercase">Winner:</span>
                    <span className="text-[9px] font-black uppercase text-emerald-400">{match.winner === 'team_a' ? match.team_a : match.team_b}</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
