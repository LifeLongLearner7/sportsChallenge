import { Suspense } from "react";
import LandingHero from "@/components/LandingHero";
import TopPredictorStream, { TopPredictorSkeleton } from "@/components/TopPredictorStream";
import AuthPortal from "@/components/AuthPortal";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Zap, Bot } from "lucide-react";
import { getLandingStats, getUserProfile } from "@/lib/data-actions";
import { redirect } from "next/navigation";

export default async function Home() {
  // FAST PATH: Get core landing stats and profile (highly cached)
  const [stats, profile] = await Promise.all([
    getLandingStats(),
    getUserProfile()
  ]);

  // If user is already logged in and has completed onboarding, send to dashboard
  if (profile && profile.onboarding_completed !== false) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#050505] overflow-x-hidden flex flex-col">
      {/* Centered Branding Header - Matches reference exactly */}
      <header className="w-full pt-16 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="w-20 h-20 relative">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            fill 
            priority 
            className="object-contain filter drop-shadow-[0_0_20px_rgba(0,229,255,0.6)]" 
            sizes="80px" 
          />
        </div>
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] font-headline uppercase leading-none">
          CYBER-SPORTS
        </h1>
      </header>
      
      {/* Main Landing Content Grid */}
      <section className="flex-1 flex flex-col items-center justify-center py-12 px-6 max-w-screen-2xl mx-auto w-full gap-16">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center w-full">
          {/* Left Column: Hero Proposition */}
          <div className="order-2 lg:order-1">
            <LandingHero stats={stats} />
          </div>

          {/* Right Column: Portal Access Gateway */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <AuthPortal />
          </div>
        </div>

        {/* Tactical Features Row - Re-integrated Lower Part */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          {/* Card 1: Live Insights */}
          <div className="p-6 glass-panel rounded-2xl flex flex-col gap-4 group hover:bg-white/5 transition-all border-white/5 hover:border-primary/30 shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.15)]">
              <Zap className="text-primary" size={24} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-black text-xl uppercase tracking-tighter italic text-white/90">
                LIVE <span className="text-primary italic">INSIGHTS</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Streaming real-time telemetry from active arenas. Power your predictions with raw, uncurated feeds from the neural core.
              </p>
            </div>
          </div>

          {/* Card 2: Mr. Predicto */}
          <div className="p-6 glass-panel rounded-2xl flex flex-col gap-4 group hover:bg-white/5 transition-all border-white/5 hover:border-secondary/30 shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 bg-secondary/10 border border-secondary/20 flex items-center justify-center rounded-xl shadow-[0_0_15px_rgba(255,107,152,0.15)]">
              <Bot className="text-secondary" size={24} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-black text-xl uppercase tracking-tighter italic text-white/90">
                MR. <span className="text-secondary italic">PREDICTO</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Beat our AI rival — an advanced ML model architectured for high-accuracy sports foresight and strategic analysis.
              </p>
            </div>
          </div>

          {/* Card 3: Top Predictor Stream */}
          <Suspense fallback={<TopPredictorSkeleton />}>
            <TopPredictorStream />
          </Suspense>
        </div>
      </section>

      <Footer />
    </main>
  );
}
