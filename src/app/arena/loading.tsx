export default function ArenaLoading() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-6">
      <nav className="fixed top-0 left-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl border-b border-cyan-500/15 shadow-[0_4px_20px_rgba(0,0,0,0.5)] h-20 animate-pulse"></nav>
      
      <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-12 gap-8 h-[calc(100vh-160px)] animate-pulse">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20"></div>
               <div className="h-10 w-48 bg-white/5 rounded"></div>
             </div>
             <div className="h-6 w-96 bg-white/5 rounded"></div>
          </div>
          <div className="glass-panel p-8 rounded-2xl h-64 border-white/5 bg-white/5"></div>
          <div className="h-6 w-32 bg-white/5 rounded mt-4"></div>
          <div className="glass-panel h-32 rounded-xl border-white/5 bg-white/5"></div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-5 flex flex-col glass-panel rounded-2xl border-white/10 bg-black/20 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center bg-white/5 gap-3 h-20">
            <div className="w-8 h-8 rounded-lg bg-primary/10"></div>
            <div className="w-32 h-4 bg-white/10 rounded"></div>
          </div>
          <div className="flex-1 p-5 flex flex-col gap-6">
            <div className="w-2/3 h-16 bg-white/5 rounded-2xl self-start"></div>
            <div className="w-1/2 h-16 bg-primary/20 rounded-2xl self-end"></div>
            <div className="w-3/4 h-24 bg-white/5 rounded-2xl self-start"></div>
          </div>
          <div className="p-5 bg-black/40 border-t border-white/5 h-24"></div>
        </div>
      </div>
    </main>
  );
}
