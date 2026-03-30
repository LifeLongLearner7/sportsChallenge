"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Profile, Match } from "@/types";

import { 
  Shield, 
  RefreshCcw, 
  Database, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Activity,
  UserPlus,
  BarChart3,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { systemAutomatedSync } from "@/lib/ai-actions";
import { adminSignUp } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AdminClientProps {
  profile: Profile | null;
  analytics: {
    dailyVolume: { date: string; count: number }[];
    sentiment: {
      teamA: number;
      teamB: number;
      teamAName: string;
      teamBName: string;
      total: number;
    };
  };
  completedMatches?: Match[];
  totalUsers: number;
}


import { useRouter } from "next/navigation";

export default function AdminClient({ profile, analytics, completedMatches = [], totalUsers }: AdminClientProps) {

  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const [syncLogs, setSyncLogs] = useState<{ id: number; msg: string; type: 'info' | 'success' | 'err' }[]>([]);

  // Enrollment State
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollPassword, setEnrollPassword] = useState("");

  const addLog = (msg: string, type: 'info' | 'success' | 'err' = 'info') => {
    setSyncLogs(prev => [{ id: Date.now(), msg, type }, ...prev]);
  };

  const handlePulseTrigger = async () => {
    try {
      setIsSyncing(true);
      addLog("Neural Link Initiated: Connecting to OpenAI Core...", "info");
      const result = await systemAutomatedSync();
      
      if (result.mode === "skipped") {
        addLog("Sync Skipped: Data already synchronized for current cycle.", "info");
      } else {
        addLog("Pulse Successful: Results resolved and AI Insights cached.", "success");
      }
    } catch (err) {
      addLog("Critical Failure: Neural Link severed. Check API logs.", "err");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollEmail || !enrollPassword) return;

    try {
      setIsEnrolling(true);
      addLog(`Initiating Enrollment for: ${enrollEmail}...`, "info");
      
      const formData = new FormData();
      formData.append("email", enrollEmail);
      formData.append("password", enrollPassword);
      
      const result = await adminSignUp(formData);
      
      if (result.success) {
        addLog(`SUCCESS: Strategist ${enrollEmail} synchronized to fleet.`, "success");
        setEnrollEmail("");
        setEnrollPassword("");
      } else {
        addLog(`ENROLLMENT FAILED: ${result.error}`, "err");
      }
    } catch (err) {
      addLog("UNAUTHORIZED OVERRIDE: Enrollment protocol breached.", "err");
    } finally {
      setIsEnrolling(false);
    }
  };

  if (!profile?.is_admin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="glass-panel p-12 rounded-3xl max-w-md border-red-500/20 bg-red-500/5">
           <AlertTriangle size={48} className="text-red-500 mx-auto mb-6" />
           <h1 className="text-2xl font-headline font-black text-white uppercase italic mb-4">Access Restricted</h1>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
             This terminal is reserved for Strategist-Class administrators. Your identity does not match current clearance levels.
           </p>
        </div>
      </main>
    );
  }

  const maxFreq = Math.max(...analytics.dailyVolume.map(v => v.count), 1);

  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-6">
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      
      <div className="max-w-screen-xl mx-auto flex flex-col gap-8">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                  <Shield size={20} className="text-secondary" />
                </div>
                <h1 className="font-headline text-4xl font-black text-white uppercase italic tracking-tighter">
                  Command <span className="text-secondary">Center</span>
                </h1>
              </div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] bg-white/5 w-fit px-3 py-1 rounded">
                 High-Altitude Operational Controls | v3.2 Intel-Enabled
              </p>
           </div>

           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Strategists</span>
                 <span className="text-xl font-headline font-black text-white italic">{totalUsers.toLocaleString()}</span>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push("/admin/matches")}>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                   Grid Control <ChevronRight size={8} />
                 </span>
                 <span className="text-xl font-headline font-black text-secondary italic underline decoration-secondary/30 decoration-offset-4">Tactical Grid</span>
              </div>
           </div>

        </div>

        <div className="grid lg:grid-cols-12 gap-8">
           
           {/* Left Column: Controls & Enrollment */}
           <div className="lg:col-span-4 flex flex-col gap-8">
              
              {/* Sync Controls */}
              <div className="glass-panel p-8 rounded-2xl border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-primary/20"></div>
                 <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Zap size={14} className="text-primary" /> Operational Pulse
                 </h3>
                 
                 <div className="flex flex-col gap-4">
                    <button 
                      onClick={handlePulseTrigger}
                      disabled={isSyncing}
                      className={cn(
                        "w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest transition-all",
                        isSyncing 
                          ? "bg-white/5 text-slate-500 cursor-not-allowed" 
                          : "bg-primary text-slate-950 hover:bg-white active:scale-95 shadow-[0_0_20px_rgba(129,236,255,0.2)]"
                      )}
                    >
                       {isSyncing ? <RefreshCcw className="animate-spin" size={16} /> : <Zap size={16} />}
                       {isSyncing ? "Synchronizing..." : "Execute Daily Pulse"}
                    </button>
                    
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter leading-relaxed">
                      Resolves yesterday's results and generates new AI predictions for today's active operational zones.
                    </p>
                 </div>
              </div>

              {/* Strategist Enrollment */}
              <div className="glass-panel p-8 rounded-2xl border-white/5 bg-black/40">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                   <UserPlus size={14} className="text-secondary" /> Human Asset Management
                 </h3>
                 
                 <form onSubmit={handleEnrollment} className="flex flex-col gap-4">
                    <div className="space-y-4">
                       <div className="flex flex-col gap-1.5">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Strategist Email</label>
                          <input 
                            required
                            type="email" 
                            value={enrollEmail}
                            onChange={(e) => setEnrollEmail(e.target.value)}
                            placeholder="OPERATOR_IDENTITY@CYBER.NET"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-slate-600 focus:border-secondary/50 outline-none transition-all"
                          />
                       </div>
                       <div className="flex flex-col gap-1.5">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Protocol (Password)</label>
                          <input 
                            required
                            type="password" 
                            value={enrollPassword}
                            onChange={(e) => setEnrollPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-slate-600 focus:border-secondary/50 outline-none transition-all"
                          />
                       </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isEnrolling}
                      className="w-full py-4 mt-2 rounded-xl bg-secondary text-slate-950 font-black uppercase text-xs tracking-widest hover:bg-white active:scale-95 transition-all disabled:opacity-50"
                    >
                       {isEnrolling ? <RefreshCcw className="animate-spin mx-auto" size={16} /> : "Enroll New Strategist"}
                    </button>
                 </form>
              </div>
           </div>

           {/* Right Column: Analytics & Logs */}
           <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* Analytics Top Row */}
              <div className="grid md:grid-cols-2 gap-8">
                 
                 {/* Operational Pulse Graph */}
                 <div className="glass-panel p-8 rounded-2xl border-white/5 bg-black/20 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <BarChart3 size={14} className="text-primary" /> Prediction Flux
                       </h3>
                       <span className="text-[9px] font-black text-slate-500 uppercase">Last 7 Cycles</span>
                    </div>

                    <div className="flex items-end justify-between gap-2 h-40 pt-4">
                       {analytics.dailyVolume.map((item, idx) => (
                         <div key={idx} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                            <div className="relative w-full flex flex-col items-center justify-end h-full">
                               <motion.div 
                                 initial={{ height: 0 }}
                                 animate={{ height: `${(item.count / maxFreq) * 100}%` }}
                                 className="w-full max-w-[12px] bg-gradient-to-t from-primary/20 to-primary rounded-t-sm group-hover:from-primary group-hover:to-white transition-all shadow-[0_0_10px_rgba(129,236,255,0.1)] group-hover:shadow-primary/40"
                               />
                               <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-white bg-slate-900 px-1.5 py-0.5 rounded border border-primary/20">
                                 {item.count}
                               </div>
                            </div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter rotate-[-45deg] origin-top-left -ml-2 mb-2">
                               {item.date}
                            </span>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Sentiment Dominance */}
                 <div className="glass-panel p-8 rounded-2xl border-white/5 bg-black/20 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <TrendingUp size={14} className="text-secondary" /> Strategic Sentiment
                       </h3>
                       <span className="text-[9px] font-black text-slate-500 uppercase">Active Fixture</span>
                    </div>

                    <div className="flex flex-col gap-4 mt-2">
                       <div className="flex items-center justify-between font-headline italic">
                          <span className="text-lg font-black text-white">{analytics.sentiment.teamAName}</span>
                          <span className="text-sm font-bold text-secondary">{analytics.sentiment.teamA}% Favor</span>
                       </div>
                       
                       <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/5 p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${analytics.sentiment.teamA}%` }}
                            className="h-full bg-secondary rounded-l-full shadow-[0_0_15px_rgba(255,214,0,0.3)]"
                          />
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${analytics.sentiment.teamB}%` }}
                            className="h-full bg-slate-700 rounded-r-full"
                          />
                       </div>

                       <div className="flex items-center justify-between font-headline italic">
                          <span className="text-sm font-bold text-slate-500">{analytics.sentiment.teamB}% Skeptic</span>
                          <span className="text-lg font-black text-slate-300">{analytics.sentiment.teamBName}</span>
                       </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Consensus Data</span>
                       </div>
                       <span className="text-[10px] font-black text-white italic">{analytics.sentiment.total} Votes</span>
                    </div>
                 </div>

              </div>

              {/* Terminal Logs */}
              <div className="glass-panel rounded-2xl border-white/5 bg-black/40 flex flex-col overflow-hidden flex-1 min-h-[300px]">
                 <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} className="text-slate-400" /> Terminal Activity Stream
                    </h3>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <span className="text-[8px] font-black text-green-500 uppercase">Uplink Stable</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex-1 p-6 font-mono text-[10px] flex flex-col gap-4 overflow-y-auto max-h-[400px] custom-scrollbar">
                    {syncLogs.length > 0 ? (
                      syncLogs.map(log => (
                        <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 transition-all">
                           <span suppressHydrationWarning className="text-slate-700 font-bold opacity-50">[{new Date(log.id).toLocaleTimeString()}]</span>
                           <div className="flex items-center gap-2">
                              {log.type === 'success' && <CheckCircle2 size={12} className="text-green-500" />}
                              {log.type === 'err' && <AlertTriangle size={12} className="text-red-500" />}
                              {log.type === 'info' && <ChevronRight size={10} className="text-primary" />}
                              <span className={cn(
                                log.type === 'success' ? "text-green-500" : 
                                log.type === 'err' ? "text-red-500" : 
                                "text-slate-300"
                              )}>
                                 {log.msg}
                              </span>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 py-20 opacity-30 text-center">
                         <Activity size={32} className="text-slate-500 animate-pulse" />
                         <p className="uppercase tracking-[0.3em] font-black">Waiting for Operational Signals</p>
                      </div>
                    )}
                 </div>
              </div>

           </div>

        </div>

      </div>
    </main>
  );
}
