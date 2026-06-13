import type { Metadata } from "next";
import { getUserProfile } from "@/lib/data-actions";
import Navbar from "@/components/Navbar";
import { BookOpen, Target, Users, Zap, ShieldAlert, Trophy, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Rules — Sports AI Challenge",
  description: "Learn how the scoring system works, how to compete in private groups, and how to beat the AI.",
};

export default async function RulesPage() {
  const profile = await getUserProfile();

  return (
    <>
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      <main className="min-h-screen pt-24 pb-20 relative px-6 z-10 overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto relative space-y-12">
          {/* Header */}
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest rounded-full mb-2">
              <BookOpen size={14} /> Official Guidelines
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-black italic uppercase tracking-tighter drop-shadow-lg text-white">
              Rules & <span className="text-primary">Scoring</span>
            </h1>
            <p className="text-slate-400 md:text-xl font-medium max-w-2xl">
              Master the system to climb the ranks and outsmart the AI in the global arena.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Rule 1 */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={120} />
              </div>
              <h2 className="text-2xl font-headline font-black uppercase italic tracking-tight text-white mb-4 flex items-center gap-3">
                <span className="bg-primary/20 text-primary p-2 rounded-xl">01</span>
                Making Predictions
              </h2>
              <ul className="space-y-4 text-slate-300 font-medium">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p>You can predict the winner of any upcoming match.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p>Predictions are strictly locked at the scheduled match start time. No changes are permitted after the lockdown.</p>
                </li>
              </ul>
            </div>

            {/* Rule 2 */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={120} />
              </div>
              <h2 className="text-2xl font-headline font-black uppercase italic tracking-tight text-white mb-4 flex items-center gap-3">
                <span className="bg-green-500/20 text-green-400 p-2 rounded-xl">02</span>
                Scoring System
              </h2>
              <ul className="space-y-4 text-slate-300 font-medium">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                  <p>Correct predictions award you <strong className="text-white">100 points</strong>.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0" />
                  <p><strong className="text-yellow-400 uppercase tracking-widest text-xs border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 rounded mr-2">Neural Override</strong> If you predict correctly when the AI is wrong, you earn <strong className="text-white">150 points</strong> instead of 100.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                  <p>Incorrect predictions award you <strong className="text-white">0 points</strong>.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                  <p>If a match is abandoned, canceled, or ends in no result, points are neither awarded nor deducted.</p>
                </li>
              </ul>
            </div>

            {/* Rule 3 */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={120} />
              </div>
              <h2 className="text-2xl font-headline font-black uppercase italic tracking-tight text-white mb-4 flex items-center gap-3">
                <span className="bg-purple-500/20 text-purple-400 p-2 rounded-xl">03</span>
                Private Groups
              </h2>
              <ul className="space-y-4 text-slate-300 font-medium">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <p>Points in a private group start at 0 from the moment you join. Past predictions do not count towards your group score.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <p>Maximum of 20 members per group.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <p>The creator of the group can promote other members to Admin or revoke Admin status.</p>
                </li>
              </ul>
            </div>

            {/* Rule 4 */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={120} />
              </div>
              <h2 className="text-2xl font-headline font-black uppercase italic tracking-tight text-white mb-4 flex items-center gap-3">
                <span className="bg-yellow-500/20 text-yellow-400 p-2 rounded-xl">04</span>
                The AI Opponent
              </h2>
              <ul className="space-y-4 text-slate-300 font-medium">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0" />
                  <p>A specialized AI (Mr. Predicto) is making its own predictions alongside humans.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0" />
                  <p>The AI is bound by the exact same rules as you: it locks in its prediction at match start time and cannot change it.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0" />
                  <p>Your goal is to achieve a higher accuracy and point total than the AI on the global leaderboard.</p>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 md:p-8 flex gap-6 items-start">
            <div className="bg-red-500/20 p-3 rounded-2xl shrink-0">
              <ShieldAlert size={24} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-red-400 uppercase tracking-widest mb-2">Fair Play Policy</h3>
              <p className="text-red-200/80 font-medium leading-relaxed">
                Multiple accounts, exploiting bugs, or attempting to bypass the lockdown mechanisms will result in a permanent ban and removal from all leaderboards. Play fair, trust your sports knowledge, and may the best strategist win.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
