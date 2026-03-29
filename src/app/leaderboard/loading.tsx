export default function LeaderboardLoading() {
  return (
    <main className="min-h-screen pt-32 pb-20 bg-background relative overflow-hidden">
      <nav className="fixed top-0 left-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl border-b border-cyan-500/15 shadow-[0_4px_20px_rgba(0,0,0,0.5)] h-20 animate-pulse"></nav>
      
      <div className="max-w-screen-2xl mx-auto px-6 relative z-10 flex flex-col gap-16 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 text-center items-center">
          <div className="h-16 w-3/4 max-w-2xl bg-white/5 rounded-2xl"></div>
          <div className="h-4 w-48 bg-white/5 rounded"></div>
        </div>

        {/* Podium Skeleton */}
        <div className="grid md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto w-full">
          <div className="order-2 md:order-1 flex flex-col items-center gap-6"><div className="w-24 h-24 bg-white/5 rounded-full"></div></div>
          <div className="order-1 md:order-2 flex flex-col items-center gap-8"><div className="w-32 h-32 bg-tertiary/20 rounded-full"></div></div>
          <div className="order-3 md:order-3 flex flex-col items-center gap-6"><div className="w-24 h-24 bg-white/5 rounded-full"></div></div>
        </div>

        {/* Table Skeleton */}
        <div className="glass-panel text-center md:text-left rounded-[30px] md:rounded-[40px] overflow-hidden border-white/5 shadow-2xl h-96 bg-white/5"></div>
      </div>
    </main>
  );
}
