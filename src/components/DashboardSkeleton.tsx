import React from 'react';

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#050505] p-4 lg:p-8 pt-24 space-y-8 animate-pulse">
      {/* HUD Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/10" />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Feed Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-10 w-48 bg-white/10 rounded-lg mb-6" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[200px] bg-white/5 rounded-3xl border border-white/10" />
          ))}
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <div className="h-10 w-40 bg-white/10 rounded-lg mb-6" />
          <div className="h-[400px] bg-white/5 rounded-3xl border border-white/10" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
