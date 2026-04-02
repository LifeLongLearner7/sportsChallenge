"use client";

import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 bg-white/5 rounded-full animate-pulse" />
          <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-lg bg-white/5 animate-pulse" />
          <div className="w-12 h-12 rounded-lg bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 glass-panel border border-white/5 rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Main Content (Arena Logic) Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Match Stream (Left) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 glass-panel border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Tactical Dossier (Right) */}
        <div className="flex flex-col gap-6">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-[600px] glass-panel border border-white/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
