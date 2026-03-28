import Navbar from "@/components/Navbar";
import { ArrowRight, Bot, Zap } from "lucide-react";
import Link from "next/link";
import AuthPortal from "@/components/AuthPortal";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <Navbar />
      
      {/* Background Visuals */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="hero-glow absolute inset-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]"></div>
      </div>

      <section className="relative z-10 max-w-screen-2xl mx-auto px-6 pt-32 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Column: Immersive Content */}
        <div className="flex flex-col gap-8 order-2 lg:order-1">
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/30 text-secondary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase w-fit">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#ff6b98] animate-pulse"></span>
              Live: Human vs AI Epoch 7
            </span>
            <h1 className="font-headline text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase italic">
              WELCOME TO <br/>THE <span className="text-primary italic">Synthetic</span> <br/>
              <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Arena</span>
            </h1>
            <p className="max-w-md text-on-surface-variant text-lg leading-relaxed">
              Experience the high-velocity fusion of T20 energy and futuristic AI precision. Predict outcomes, master the meta, and claim your status.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <Link href="/dashboard" className="px-8 py-4 bg-gradient-to-br from-primary to-primary-dim text-slate-950 font-headline font-extrabold uppercase tracking-widest rounded-md scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(129,236,255,0.4)] hover:shadow-[0_0_30px_rgba(129,236,255,0.6)]">
              Join the Arena
            </Link>
            <div className="flex -space-x-3 items-center ml-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 bg-surface-container-highest rounded-full border-2 border-surface hex-clip overflow-hidden">
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">U{i}</div>
                </div>
              ))}
              <div className="w-10 h-10 bg-surface-container-highest rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-primary bg-primary/20">
                12K+
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-6 glass-panel rounded-xl flex flex-col gap-2 group hover:bg-surface-container-high transition-colors">
              <Zap className="text-primary" size={32} />
              <h3 className="font-headline font-bold text-lg uppercase tracking-tight">LIVE INSIGHTS</h3>
              <p className="text-xs text-on-surface-variant">Real-time data powering your predictions</p>
            </div>
            <div className="p-6 glass-panel rounded-xl flex flex-col gap-2 group hover:bg-surface-container-high transition-colors">
              <Bot className="text-secondary" size={32} />
              <h3 className="font-headline font-bold text-lg uppercase tracking-tight">AI Opponents</h3>
              <p className="text-xs text-on-surface-variant">Battle against advanced machine learning algorithms.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Portal */}
        <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
          <AuthPortal />
        </div>
      </section>

      {/* Stats Stream Overlay */}
      <div className="absolute bottom-0 left-0 w-full bg-slate-950/40 backdrop-blur-md border-t border-white/5 py-4 overflow-hidden whitespace-nowrap z-30">
        <div className="animate-marquee font-headline text-[10px] font-bold tracking-tighter uppercase italic text-slate-400">
          <div className="flex items-center gap-12">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex gap-12 items-center">
                <div className="flex items-center gap-4"><span className="text-secondary w-2 h-2 rounded-full bg-secondary shadow-[0_0_5px_#ff6b98]"></span> HUMAN SCORE: 14,204</div>
                <div className="flex items-center gap-4"><span className="text-primary w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_#81ecff]"></span> AI CORE SCORE: 12,891</div>
                <div className="flex items-center gap-4"><span className="text-tertiary w-2 h-2 rounded-full bg-tertiary shadow-[0_0_5px_#ffe792]"></span> GLOBAL ACCURACY: 68.4%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
