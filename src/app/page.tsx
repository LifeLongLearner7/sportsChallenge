import Image from "next/image";
import { Bot, Zap } from "lucide-react";
import AuthPortal from "@/components/AuthPortal";
import LandingHero from "@/components/LandingHero";
import { getLandingStats } from "@/lib/data-actions";

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

      <section className="relative z-10 max-w-screen-2xl mx-auto px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Column: Immersive Content (Client Component) */}
        <LandingHero stats={stats} />


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
                <div className="flex items-center gap-4">
                  <span className="text-secondary w-2 h-2 rounded-full bg-secondary shadow-[0_0_5px_#ff6b98]"></span> 
                  HUMAN SCORE: {stats.humanScore}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-primary w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_#81ecff]"></span> 
                  AI CORE INTEGRITY: {stats.aiScore}
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
