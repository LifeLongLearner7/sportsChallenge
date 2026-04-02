import Image from "next/image";
import { Bot, Zap, Trophy } from "lucide-react";
import AuthPortal from "@/components/AuthPortal";
import LandingHero from "@/components/LandingHero";
import { getLandingStats } from "@/lib/data-actions";
import { MR_PREDICTO_AVATAR } from "@/lib/constants";

export default async function LandingPage() {
  const stats = await getLandingStats();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      
      {/* Centered Brand Signature */}
      <div className="relative w-full z-50 flex flex-col items-center pt-10 pb-2 gap-4">
        <div className="w-20 h-20 relative animate-pulse">
           <Image src="/logo.png" alt="Cyber Sports Logo" fill priority className="object-contain filter drop-shadow-[0_0_15px_rgba(0,229,255,0.6)]" sizes="(max-width: 768px) 80px, 80px" />
        </div>
        <div className="text-4xl md:text-6xl font-black italic tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(0,229,255,0.4)] font-headline uppercase select-none">
          CYBER-SPORTS
        </div>
      </div>
      
      {/* Background Visuals */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="hero-glow absolute inset-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]"></div>
      </div>

      <section className="relative z-10 max-w-screen-2xl mx-auto px-6 pt-10 grid lg:grid-cols-2 gap-16 items-start">
        {/* Left Column: Immersive Content (Client Component) */}
        <LandingHero stats={stats} />

        {/* Right Column: Auth Portal */}
        <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
          <AuthPortal />
        </div>
      </section>

      {/* Full-Width Feature Row (Elite Row) */}
      <section className="relative z-10 max-w-screen-2xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Live Insights */}
          <div className="p-8 glass-panel rounded-2xl flex flex-col gap-5 group hover:bg-surface-container-high transition-all border-white/5 hover:border-primary/30">
            <Zap className="text-primary-dim group-hover:text-primary transition-colors" size={40} />
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-2xl uppercase tracking-tight text-slate-300 italic">LIVE INSIGHTS</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                Streaming real-time telemetry from active arenas. Power your predictions with raw, uncurated feeds.
              </p>
            </div>
          </div>

          {/* Card 2: Mr. Predicto */}
          <div className="p-8 glass-panel rounded-2xl flex flex-col gap-5 group hover:bg-surface-container-high transition-all border-white/5 hover:border-secondary/30">
            <div className="relative w-14 h-14 hex-clip border border-secondary/30 shadow-[0_0_20px_rgba(255,107,152,0.4)] overflow-hidden">
               <Image 
                 src={MR_PREDICTO_AVATAR.path!} 
                 fill 
                 sizes="56px"
                 className="object-cover" 
                 alt="Mr. Predicto" 
               />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-black text-2xl uppercase tracking-tighter italic text-white flex items-center gap-2">
                MR. <span className="text-secondary">PREDICTO</span>
              </h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Beat our AI rival - an advanced ML model architected for high-accuracy sports foresight.
              </p>
            </div>
          </div>

          {/* Card 3: Top Predictor */}
          <div className="p-8 glass-panel rounded-2xl flex flex-col gap-5 group hover:bg-surface-container-high transition-all border-white/5 hover:border-primary/30">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 border border-primary/30 flex items-center justify-center hex-clip shadow-[0_0_20px_rgba(129,236,255,0.2)]">
                   <Trophy className="text-primary" size={28} />
                </div>
                <h3 className="font-headline font-black text-2xl uppercase tracking-tighter italic text-white/50">
                   TOP <span className="text-primary/70">PREDICTOR</span>
                </h3>
             </div>

             <div className="flex flex-col gap-2">
                <div className="w-full text-center text-primary font-headline font-black uppercase text-3xl italic tracking-tighter drop-shadow-[0_0_12px_rgba(129,236,255,0.7)]">
                   {stats.topPredictor?.screen_name || "STRIKER_X"}
                </div>
                
                <div className="mt-2 bg-black/60 rounded-xl p-4 border border-white/5 shadow-inner flex flex-col gap-3">
                   <div className="flex justify-between items-center text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">
                      <span>Tactical Win Rate</span>
                      <span className="text-white italic">{stats.topPredictor?.accuracy || 0}%</span>
                   </div>
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px] relative">
                      <div 
                         className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary-dim rounded-full shadow-[0_0_15px_rgba(129,236,255,0.4)] transition-all duration-1000"
                         style={{ width: `${stats.topPredictor?.accuracy || 0}%` }}
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Stream Overlay */}
      <div className="absolute bottom-0 left-0 w-full bg-slate-950/40 backdrop-blur-md border-t border-white/5 py-4 overflow-hidden whitespace-nowrap z-30">
        <div className="animate-marquee font-headline text-[10px] font-bold tracking-tighter uppercase italic text-slate-400">
          <div className="flex items-center gap-12">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex gap-12 items-center">
                <div className="flex items-center gap-4">
                  <span className="text-secondary w-2 h-2 rounded-full bg-secondary shadow-[0_0_5px_#ff6b98]"></span> 
                  HUMAN SCORE: {stats.humanScore}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-primary w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_#81ecff]"></span> 
                  MR. PREDICTO: {stats.aiScore}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-tertiary w-2 h-2 rounded-full bg-tertiary shadow-[0_0_5px_#ffe792]"></span> 
                  GLOBAL ACCURACY: {stats.globalAccuracy}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
