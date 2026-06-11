"use client";

import React, { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { TEAM_LOGOS, FIFA_TEAM_LOGOS } from "@/lib/constants";
import { 
  updateMatchWinner, 
  triggerManualSync, 
  triggerGlobalAudit, 
  triggerCachePurge,
  triggerTournamentRegistrySync,
  runCollisionAudit,
  linkMatchSurgically,
  resolveMatchAbandoned
} from "@/lib/data-actions";
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
  Binary,
  Database,
  Unlink,
  ExternalLink,
  ShieldCheck,
  Search,
  CloudRain
} from "lucide-react";

/**
 * Tactical Command Center: Admin Match Management
 * Allows manual overrides and triggering the synchronization pulse.
 */
export default function AdminMatchesClient({ initialMatches }: { initialMatches: Match[] }) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'info' | 'error' | 'success' } | null>(null);
  const [showAuditConfirm, setShowAuditConfirm] = useState(false);
  const [abandonConfirmId, setAbandonConfirmId] = useState<string | null>(null);
  const [conflictReport, setConflictReport] = useState<{ unlinked: any[], conflicts: any[], mapped: number } | null>(null);
  const [activeSport, setActiveSport] = useState<'cricket' | 'football'>('football');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleIdentityAudit = async () => {
    setSyncing(true);
    setStatusMessage({ text: "Initiating Identity Conflict Analysis...", type: "info" });
    try {
      const report = await runCollisionAudit();
      setConflictReport(report);
      setStatusMessage({ text: `Audit Complete: ${report.conflicts.length} Double-Headers discovered.`, type: "success" });
    } catch (error) {
      setStatusMessage({ text: "Identity Audit Failure: API link disrupted.", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const handleSurgicalLink = async (matchId: string, externalId: string) => {
    setSyncing(true);
    setStatusMessage({ text: "Forging Permanent Identity Link...", type: "info" });
    try {
      await linkMatchSurgically(matchId, externalId);
      await fetchMatches();
      // Update local conflict report state to remove the resolved match
      if (conflictReport) {
        setConflictReport({
          ...conflictReport,
          conflicts: conflictReport.conflicts.filter(c => c.id !== matchId),
          mapped: conflictReport.mapped + 1
        });
      }
      setStatusMessage({ text: "Surgical Link Established.", type: "success" });
    } catch (error) {
       setStatusMessage({ text: "Linking Failure: Database mutation aborted.", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const handleTournamentSync = async () => {
    setSyncing(true);
    setStatusMessage({ text: "Re-mapping Tournament Identities...", type: "info" });
    try {
      const result = await triggerTournamentRegistrySync();
      if (result.success) {
        await fetchMatches();
        setStatusMessage({ text: `Registry Sync Complete: ${result.count} matches surgically linked.`, type: "success" });
      } else {
        setStatusMessage({ text: `Registry Error: ${result.error}`, type: "error" });
      }
    } catch (error) {
      setStatusMessage({ text: "Tournament Mapping Failure: Connection lost.", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const fetchMatches = useCallback(async () => {
    try {
      // Re-fetch logic triggered intentionally via router refresh or manual sync downstream if we extracted `getMatches` here we'd keep it, 
      // but since it's a Server Action, Next routing already invalidates it.
      router.refresh(); 
    } catch (error) {
      console.error("Failed to refresh matches:", error);
    }
  }, [router]);

  const handleUpdateWinner = async (matchId: string, winnerKey: "team_a" | "team_b" | "draw") => {
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

  const handleMatchAbandoned = async (matchId: string) => {
    setAbandonConfirmId(null);
    setSyncing(true);
    setStatusMessage({ text: "Initiating Abandoned Resolution Protocol...", type: "info" });
    try {
      await resolveMatchAbandoned(matchId);
      await fetchMatches();
      setStatusMessage({ text: "Match Resolved: 50-Point Compensation Pulse Dispatched.", type: "success" });
    } catch (error) {
      setStatusMessage({ text: "Resolution Failure: Protocol aborted.", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const handleGlobalAudit = async () => {
    setShowAuditConfirm(false);
    setSyncing(true);
    setStatusMessage({ text: "Initiating Deep Sector Audit...", type: "info" });
    try {
      const result = await triggerGlobalAudit() as any;
      await fetchMatches();
      setStatusMessage({ text: `Audit Complete: Re-calibrating strategist pools.`, type: "success" });
    } catch (error) {
      setStatusMessage({ text: "System Audit Failure: Data reconstruction aborted.", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const handleCachePurge = async () => {
    setSyncing(true);
    setStatusMessage({ text: "Purging Synthetic Cache...", type: "info" });
    try {
      const result = await triggerCachePurge();
      setStatusMessage({ text: `Global Cache Wiped: ${result.pathsCleared} sectors revalidated.`, type: "success" });
    } catch (error) {
      setStatusMessage({ text: "Cache Purge Failure: System memory locked.", type: "error" });
    } finally {
      setSyncing(false);
    }
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

  const filteredMatches = matches.filter(m => (m.sport || "cricket") === activeSport);
  const upcomingMatches = filteredMatches.filter(m => m.status !== "completed");
  const completedMatches = filteredMatches
    .filter(m => m.status === "completed")
    .sort((a, b) => new Date(b.match_time).getTime() - new Date(a.match_time).getTime());

  const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans selection:bg-purple-500/30">
      {/* HUD Header */}
      <header className="max-w-7xl mx-auto mb-8 border-b border-white/5 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.push("/admin")}
            className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.3em] text-white/80 hover:text-white transition-all group px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
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
          </button>

          <button 
            onClick={handleTournamentSync}
            disabled={syncing || isPending}
            className="relative group px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2 hover:bg-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Database className={`w-4 h-4 text-blue-400 ${syncing ? 'animate-pulse' : ''}`} />
            <span className="font-mono text-xs font-bold tracking-widest uppercase text-blue-400">Sync Tournament Registry</span>
          </button>

          <button 
            onClick={handleCachePurge}
            disabled={syncing || isPending}
            className="relative group px-6 py-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="font-mono text-xs font-bold tracking-widest uppercase">Purge System Cache</span>
          </button>

          {!showAuditConfirm ? (
            <button 
              onClick={() => setShowAuditConfirm(true)}
              disabled={syncing || isPending}
              className="relative group px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-2 hover:bg-red-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Binary className="w-4 h-4 text-red-400" />
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-red-400">System Data Audit</span>
            </button>
          ) : (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 transition-all">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Awaiting Confirmation</span>
                  <span className="text-[8px] font-mono text-white/30 uppercase">Full point & accuracy reconstruction</span>
               </div>
               <div className="flex gap-2">
                 <button 
                    onClick={handleGlobalAudit}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                  >
                    Confirm Clear-Audit
                  </button>
                  <button 
                    onClick={() => setShowAuditConfirm(false)}
                    className="px-4 py-2 bg-white/10 text-white/60 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors"
                  >
                    Abort
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </header>

      {/* Sport Selector HUD Tabs */}
      <div className="max-w-7xl mx-auto mb-8 flex gap-4">
        <button
          onClick={() => setActiveSport("football")}
          className={cn(
            "px-6 py-3 rounded-xl border text-xs font-mono uppercase tracking-widest transition-all",
            activeSport === "football"
              ? "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white"
          )}
        >
          FIFA World Cup 2026
        </button>
        <button
          onClick={() => setActiveSport("cricket")}
          className={cn(
            "px-6 py-3 rounded-xl border text-xs font-mono uppercase tracking-widest transition-all",
            activeSport === "cricket"
              ? "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white"
          )}
        >
          IPL 2026 (Cricket)
        </button>
      </div>



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
            ) : upcomingMatches.map(match => {
              const conflict = conflictReport?.conflicts.find(c => c.id === match.id);
              
              return (
                <div 
                  key={match.id}
                  className={`group relative p-6 border rounded-2xl transition-all ${
                    conflict ? 'border-purple-500/30 bg-purple-500/[0.02] hover:bg-purple-500/[0.04]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Conflict HUD Overlay */}
                  {conflict && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-purple-500 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse">
                      <Unlink className="w-3 h-3 text-white" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">Identity Collision Detected</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-8">
                      {/* Host Team */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                          {(match.sport === "football" ? FIFA_TEAM_LOGOS : TEAM_LOGOS)[match.team_a] ? (
                            <Image src={(match.sport === "football" ? FIFA_TEAM_LOGOS : TEAM_LOGOS)[match.team_a]} fill sizes="32px" className="object-cover" alt={match.team_a} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/40">
                              {match.team_a.slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-tight">{match.team_a}</p>
                          <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Host Team</p>
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-[1px] bg-white/10" />
                        <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">VS</span>
                        <div className="w-8 h-[1px] bg-white/10" />
                      </div>

                      {/* Opponent Team */}
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-bold tracking-tight text-right">{match.team_b}</p>
                          <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest text-right">Opponent</p>
                        </div>
                        <div className="relative w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                          {(match.sport === "football" ? FIFA_TEAM_LOGOS : TEAM_LOGOS)[match.team_b] ? (
                            <Image src={(match.sport === "football" ? FIFA_TEAM_LOGOS : TEAM_LOGOS)[match.team_b]} fill sizes="32px" className="object-cover" alt={match.team_b} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/40">
                              {match.team_b.slice(0, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-mono text-white/60">
                        {new Date(match.match_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest flex items-center justify-end gap-1">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                        Status: Upcoming
                      </p>
                    </div>
                  </div>

                  {/* DOUBLE HEADER RESOLUTION HUD */}
                  {conflict ? (
                    <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-purple-300 mb-3 flex items-center gap-2">
                        <ExternalLink className="w-3 h-3" />
                        Surgical Identity Selection Required (Double-Header)
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {conflict.candidates.map((c: any) => (
                          <button
                            key={c.id}
                            onClick={() => handleSurgicalLink(match.id, c.id)}
                            disabled={syncing}
                            className="flex items-center justify-between p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/20 transition-all text-left group/btn"
                          >
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white/60 font-mono uppercase tracking-tight group-hover/btn:text-white transition-colors">{c.name}</span>
                              <span className="text-[10px] font-bold text-purple-400">{new Date(c.date).toLocaleDateString()}</span>
                            </div>
                            <ShieldCheck className="w-4 h-4 text-purple-500 opacity-40 group-hover/btn:opacity-100 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={cn("grid gap-3 mt-4", activeSport === "football" ? "grid-cols-3" : "grid-cols-2")}>
                        <button 
                          onClick={() => handleUpdateWinner(match.id, "team_a")}
                          disabled={isPending || syncing}
                          className="py-3 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          Set {match.team_a} Winner
                        </button>
                        {activeSport === "football" && (
                          <button 
                            onClick={() => handleUpdateWinner(match.id, "draw")}
                            disabled={isPending || syncing}
                            className="py-3 px-4 rounded-xl border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/20 text-[10px] font-black text-amber-400 tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            Set Draw
                          </button>
                        )}
                        <button 
                          onClick={() => handleUpdateWinner(match.id, "team_b")}
                          disabled={isPending || syncing}
                          className="py-3 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          Set {match.team_b} Winner
                        </button>
                      </div>

                      {abandonConfirmId === match.id ? (
                        <div className="mt-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <p className="text-[10px] font-bold text-blue-300 uppercase leading-relaxed">
                            Points will be awarded to all strategists who predicted. Are you sure?
                          </p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleMatchAbandoned(match.id)}
                              disabled={syncing}
                              className="flex-1 py-2 px-3 rounded-lg bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-400 transition-colors disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => setAbandonConfirmId(null)}
                              disabled={syncing}
                              className="flex-1 py-2 px-3 rounded-lg border border-white/10 bg-white/5 text-white/60 text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setAbandonConfirmId(match.id)}
                          disabled={isPending || syncing}
                          className="w-full mt-3 py-3 px-4 rounded-xl border border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/20 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 text-blue-400 disabled:opacity-50"
                        >
                          <CloudRain className="w-3.5 h-3.5" />
                          Mark Abandoned (+50pts)
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
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
              {completedMatches.map(match => (
                <div key={match.id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-3 group/archive transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                        {(match.sport === "football" ? FIFA_TEAM_LOGOS : TEAM_LOGOS)[match.team_a] ? (
                          <Image src={(match.sport === "football" ? FIFA_TEAM_LOGOS : TEAM_LOGOS)[match.team_a]} fill sizes="16px" className="object-cover" alt={match.team_a} />
                        ) : (
                          <span className="text-[8px] font-bold text-white/40 flex items-center justify-center h-full w-full">{match.team_a[0]}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-tight">{match.team_a}</span>
                      <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">vs</span>
                      <span className="text-[10px] font-bold uppercase tracking-tight">{match.team_b}</span>
                      <div className="relative w-4 h-4 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                        {(match.sport === "football" ? FIFA_TEAM_LOGOS : TEAM_LOGOS)[match.team_b] ? (
                          <Image src={(match.sport === "football" ? FIFA_TEAM_LOGOS : TEAM_LOGOS)[match.team_b]} fill sizes="16px" className="object-cover" alt={match.team_b} />
                        ) : (
                          <span className="text-[8px] font-bold text-white/40 flex items-center justify-center h-full w-full">{match.team_b[0]}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-white/30 uppercase">Winner:</span>
                      <span className="text-[9px] font-black uppercase text-emerald-400">
                        {match.winner === match.team_a || match.winner === match.team_b 
                          ? match.winner 
                          : match.winner === "abandoned" 
                            ? "ABANDONED/DRAW" 
                            : "UNKNOWN"}
                      </span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                  </div>
                  
                  {/* Retroactive Surgical Resolution Protocol (v16.2) */}
                  <div className="mt-2">
                    {abandonConfirmId === match.id ? (
                      <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/10 flex flex-col gap-2">
                        <p className="text-[9px] font-bold text-blue-300 uppercase text-center leading-tight">
                          Points will be awarded to all strategists who predicted. Are you sure?
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleMatchAbandoned(match.id)}
                            disabled={syncing}
                            className="flex-1 py-1.5 px-2 rounded bg-blue-500 text-white text-[8px] font-black uppercase hover:bg-blue-400 transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setAbandonConfirmId(null)}
                            disabled={syncing}
                            className="flex-1 py-1.5 px-2 rounded border border-white/10 bg-white/5 text-white/60 text-[8px] font-bold uppercase hover:bg-white/10 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setAbandonConfirmId(match.id)}
                        disabled={isPending || syncing}
                        className="w-full py-2 px-3 rounded-lg border border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/20 text-[9px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 text-blue-400 disabled:opacity-50"
                      >
                        <CloudRain className="w-3 h-3" />
                        Retroactive Abandoned (+50pts)
                      </button>
                    )}
                  </div>
                  
                  {/* Recalculate Buttons for Admin Override */}
                  <div className={cn("grid gap-2 border-t border-white/5 pt-3", activeSport === "football" ? "grid-cols-3" : "grid-cols-2")}>
                    <button 
                      onClick={() => handleUpdateWinner(match.id, "team_a")}
                      disabled={isPending || syncing}
                      className="py-2 px-3 rounded-lg border border-white/5 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/20 text-[8px] text-white/60 hover:text-white font-bold tracking-widest uppercase transition-all disabled:opacity-50"
                    >
                      Override: {match.team_a}
                    </button>
                    {activeSport === "football" && (
                      <button 
                        onClick={() => handleUpdateWinner(match.id, "draw")}
                        disabled={isPending || syncing}
                        className="py-2 px-3 rounded-lg border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/20 text-[8px] text-amber-400 font-black tracking-widest uppercase transition-all disabled:opacity-50"
                      >
                        Override: Draw
                      </button>
                    )}
                    <button 
                      onClick={() => handleUpdateWinner(match.id, "team_b")}
                      disabled={isPending || syncing}
                      className="py-2 px-3 rounded-lg border border-white/5 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/20 text-[8px] text-white/60 hover:text-white font-bold tracking-widest uppercase transition-all disabled:opacity-50"
                    >
                      Override: {match.team_b}
                    </button>
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
