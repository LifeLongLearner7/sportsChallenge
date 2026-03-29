"use client";

import { useState, useEffect, useRef } from "react";
import { Match, Profile } from "@/types";
import { AVATARS } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { 
  Sword, 
  MessageSquare, 
  Send, 
  Trash2, 
  Shield, 
  Trophy, 
  Activity,
  User,
  Zap,
  Bot
} from "lucide-react";
import { sendArenaMessage, deleteArenaMessage } from "@/lib/data-actions";
import { createClient } from "@/lib/supabase";

interface ArenaClientProps {
  profile: Profile | null;
  completedMatches: Match[];
  initialMessages: any[];
  globalStats: {
    userCount: number;
    avgHumanAccuracy: number;
    avgAiAccuracy: number;
  };
}

export default function ArenaClient({ 
  profile, 
  completedMatches, 
  initialMessages, 
  globalStats 
}: ArenaClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Sync state with server-side revalidations
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Subscriptions for real-time chat
  useEffect(() => {
    const channel = supabase
      .channel("arena_messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "arena_messages" },
        async (payload: any) => {
          if (payload.eventType === "INSERT") {
             const { data } = await supabase
               .from("arena_messages")
               .select("*, profiles(screen_name, avatar_url)")
               .eq("id", payload.new.id)
               .single();
             
             if (data) {
               // Deduplicate to avoid issues with server revalidation
               setMessages(prev => {
                  if (prev.find(m => m.id === data.id)) return prev;
                  return [...prev, data];
               });
             }
          } else if (payload.eventType === "DELETE") {
             setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Handle scrolling
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      await sendArenaMessage(newMessage.trim());
      setNewMessage("");
    } catch (err) {
      console.error("Transmission failed:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteArenaMessage(id);
    } catch (err) {
      console.error("Erasure failed:", err);
    }
  };

  const humanLead = globalStats.avgHumanAccuracy - globalStats.avgAiAccuracy;

  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-6">
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      
      <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-12 gap-8 h-[calc(100vh-160px)]">
        
        {/* Left Column: Analytics & Records (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Header */}
          <div className="flex flex-col gap-2 mb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                 <Sword size={20} className="text-secondary" />
               </div>
               <h1 className="font-headline text-4xl font-black text-white uppercase italic tracking-tighter">
                 The <span className="text-secondary">Arena</span>
               </h1>
             </div>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] bg-white/5 w-fit px-3 py-1 rounded">
                Global Performance Analytics | Historical Conflict Reports
             </p>
          </div>

          {/* Conflict Gauge */}
          <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group border-white/5 bg-gradient-to-br from-secondary/5 to-primary/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
               <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-2">Neural Synchronization</h3>
                    <div className="text-3xl font-headline font-black text-white italic uppercase leading-none">
                       {humanLead >= 0 ? "Human" : "AI Core"} <br/>
                       Superiority: <span className={cn(humanLead >= 0 ? "text-primary" : "text-secondary")}>+{Math.abs(humanLead).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest leading-none">
                           <span className="text-slate-400">Biological Consensus</span>
                           <span className="text-white">{globalStats.avgHumanAccuracy}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-primary shadow-[0_0_12px_#81ecff]" style={{ width: `${globalStats.avgHumanAccuracy}%` }}></div>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest leading-none">
                           <span className="text-secondary/70">Synthetic Calculation</span>
                           <span className="text-secondary">{globalStats.avgAiAccuracy}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-secondary shadow-[0_0_12px_#ff6b98]" style={{ width: `${globalStats.avgAiAccuracy}%` }}></div>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="flex flex-col gap-4 items-center justify-center p-6 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                  <div className="relative">
                    <Activity size={80} className={cn("transition-colors duration-1000", humanLead >= 0 ? "text-primary/20" : "text-secondary/20")} />
                    <div className="absolute inset-0 flex items-center justify-center">
                       {humanLead >= 0 ? <User size={40} className="text-primary animate-pulse" /> : <Bot size={40} className="text-secondary animate-pulse" /> }
                    </div>
                  </div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center max-w-[150px]">
                     Current platform evolution favouring {humanLead >= 0 ? "Biological Neural Nets" : "Synthetic AI Core"}
                  </div>
               </div>
            </div>
          </div>

          {/* Combat Logs (Completed Matches) */}
          <div className="flex flex-col gap-4">
             <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-2 px-2">
               <Activity size={14} className="text-white" /> Combat Logs
             </h3>
             <div className="grid gap-4">
                {completedMatches.length > 0 ? (
                  completedMatches.map(match => {
                    const aiWinner = match.ai_prediction === match.winner;
                    return (
                      <div key={match.id} className="glass-panel p-5 rounded-xl border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="flex flex-col gap-1 items-center justify-center w-16">
                              <span className="text-[8px] font-black text-slate-500 uppercase">Winner</span>
                               <span className="text-sm font-headline font-black text-white uppercase italic">{match.winner}</span>
                           </div>
                           <div className="h-8 w-px bg-white/5"></div>
                           <div>
                              <div className="text-[10px] font-black text-white uppercase tracking-wider mb-1">
                                 {match.team_a} vs {match.team_b}
                              </div>
                              <div className="flex gap-4">
                                 <div className="flex items-center gap-1.5">
                                    <div className={cn("w-2 h-2 rounded-full", aiWinner ? "bg-green-500 shadow-[0_0_8px_green]" : "bg-red-500 shadow-[0_0_8px_red]")}></div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase">AI: {match.ai_prediction}</span>
                                 </div>

                                 <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Con: 82% Correct</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           {aiWinner ? (
                             <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1.5">
                                <Zap size={10} className="text-green-500" />
                                <span className="text-[8px] font-black text-green-500 uppercase">AI Win</span>
                             </div>
                           ) : (
                             <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-1.5">
                                <User size={10} className="text-primary" />
                                <span className="text-[8px] font-black text-primary uppercase">Human Win</span>
                             </div>
                           )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-12 text-center glass-panel border-dashed border-white/10 rounded-2xl opacity-50">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">No Concluded Records Found in Global logs</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Right Column: Tactical Comm-Link (5 cols) */}
        <div className="lg:col-span-5 flex flex-col glass-panel rounded-2xl border-white/10 bg-black/20 overflow-hidden">
           
           {/* Comm-Link Header */}
           <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <MessageSquare size={16} className="text-primary" />
                 </div>
                 <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Tactical Comm-Link</h3>
                    <div className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Live Strategic Sync | 24H Purge Active</span>
                    </div>
                 </div>
              </div>
              {profile?.is_admin && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary/10 border border-secondary/20 rounded">
                   <Shield size={10} className="text-secondary" />
                   <span className="text-[8px] font-black text-secondary uppercase">Moderator</span>
                </div>
              )}
           </div>

           {/* Message Feed */}
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 py-6 flex flex-col gap-6 custom-scrollbar">
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const isAdminMsg = msg.profiles?.is_admin;
                  const isOwn = msg.user_id === profile?.id;
                   const msgAvatar = AVATARS.find((a: any) => a.id === msg.profiles?.avatar_url) || AVATARS[0];

                   return (
                     <div key={msg.id} className={cn("flex flex-col gap-2 group max-w-[85%]", isOwn ? "self-end items-end" : "self-start items-start")}>
                         <div className="flex items-center gap-2">
                            {!isOwn && (
                              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center hex-clip overflow-hidden relative", !msgAvatar.path && msgAvatar.bg, "border border-white/10")}>
                                 {msgAvatar.path ? (
                                    <img src={msgAvatar.path} className="w-full h-full object-cover" alt="User" />
                                 ) : msgAvatar.icon ? (
                                    (() => {
                                      const Icon = msgAvatar.icon;
                                      return <Icon size={12} className={msgAvatar.color} />;
                                    })()
                                 ) : null}
                              </div>
                            )}
                            <span className={cn("text-[9px] font-black uppercase tracking-wider", isAdminMsg ? "text-secondary" : "text-slate-400")}>
                               {msg.profiles?.screen_name || "Unknown_Strategist"}
                               {isAdminMsg && " [MOD]"}
                            </span>
                            {isOwn && (
                              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center hex-clip overflow-hidden relative", !msgAvatar.path && msgAvatar.bg, "border border-white/10")}>
                                 {msgAvatar.path ? (
                                    <img src={msgAvatar.path} className="w-full h-full object-cover" alt="User" />
                                 ) : msgAvatar.icon ? (
                                    (() => {
                                      const Icon = msgAvatar.icon;
                                      return <Icon size={12} className={msgAvatar.color} />;
                                    })()
                                 ) : null}
                              </div>
                            )}
                         </div>
                        
                        <div className="relative group/msg">
                           <div className={cn(
                             "px-4 py-3 rounded-2xl text-[11px] leading-relaxed font-medium break-words border",
                             isOwn 
                               ? "bg-primary text-slate-950 border-primary shadow-[0_4px_12px_rgba(129,236,255,0.1)] rounded-tr-none" 
                               : "bg-white/5 text-white border-white/5 rounded-tl-none"
                           )}>
                              {msg.content}
                           </div>
                           
                           {/* Moderation Controls */}
                           {(profile?.is_admin || isOwn) && (
                             <button 
                               onClick={() => handleDeleteMessage(msg.id)}
                               className={cn(
                                 "absolute -top-2 opacity-0 group-hover/msg:opacity-100 transition-all p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl",
                                 isOwn ? "-left-2" : "-right-2"
                               )}
                             >
                                <Trash2 size={10} />
                             </button>
                           )}
                        </div>
                        <span suppressHydrationWarning className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter">
                           {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                  )
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center opacity-30">
                   <MessageSquare size={32} className="text-slate-500" />
                   <p className="text-[10px] font-black uppercase tracking-widest max-w-[150px]">Transmission buffer empty. Initiate tactical sync.</p>
                </div>
              )}
           </div>

           {/* Input Area */}
           <div className="p-5 bg-black/40 border-t border-white/5">
              <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
                 <div className="relative flex items-center">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Enter tactical insight..."
                      disabled={!profile}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all pr-12"
                    />
                    <button 
                      type="submit"
                      disabled={isSending || !newMessage.trim() || !profile}
                      className="absolute right-3 p-2 bg-primary text-slate-950 rounded-lg hover:bg-primary/80 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                       <Send size={16} />
                    </button>
                 </div>
                 <div className="flex justify-between items-center px-1">
                    <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">
                       Secure Terminal Sync: {profile?.screen_name || "Guest"}
                    </p>
                    <p suppressHydrationWarning className="text-[7px] font-black text-slate-600 uppercase tracking-widest">
                       Purge Cycle: {new Date().toLocaleDateString()}
                    </p>
                 </div>
              </form>
           </div>

        </div>

      </div>
    </main>
  );
}
