import Navbar from "@/components/Navbar";

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-6">
      {/* We can provide a basic skeleton Navbar here or allow Next.js to preserve the layout */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl border-b border-cyan-500/15 shadow-[0_4px_20px_rgba(0,0,0,0.5)] h-20 animate-pulse"></nav>
      
      <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-12 gap-8 animate-pulse">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl h-48 border-white/5 bg-white/5"></div>
          <div className="glass-panel p-6 rounded-2xl h-64 border-white/5 bg-white/5"></div>
        </div>

        {/* Center Column Skeleton */}
        <div className="lg:col-span-6 flex flex-col gap-8">
          <div className="h-16 w-3/4 bg-white/5 rounded-xl border border-white/5"></div>
          <div className="flex flex-col gap-6">
            <div className="glass-panel h-64 rounded-2xl border-white/5 bg-white/5"></div>
            <div className="glass-panel h-64 rounded-2xl border-white/5 bg-white/5"></div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl h-64 border-white/5 bg-white/5"></div>
          <div className="glass-panel p-6 rounded-2xl h-64 border-white/5 bg-white/5"></div>
        </div>
      </div>
    </main>
  );
}
