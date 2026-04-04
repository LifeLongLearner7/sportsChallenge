import { Suspense } from "react";
import { getLeaderboard, getLeaderboardStats, getUserProfile } from "@/lib/data-actions";
import LeaderboardClient from "@/components/LeaderboardClient";
import Navbar from "@/components/Navbar";
import DashboardSkeleton from "@/components/DashboardSkeleton";

export default async function LeaderboardPage() {
  // FAST PATH: Shell + Navbar + Profile
  const profile = await getUserProfile();

  return (
    <>
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      <Suspense fallback={<DashboardSkeleton />}>
        <LeaderboardDataWrapper profile={profile} />
      </Suspense>
    </>
  );
}

async function LeaderboardDataWrapper({ profile }: { profile: any }) {
  // STREAMING PATH: Rankings + Stats
  const [leaderboard, stats] = await Promise.all([
    getLeaderboard(),
    getLeaderboardStats(),
  ]);

  return (
    <LeaderboardClient 
      initialProfiles={leaderboard} 
      stats={stats}
      currentUserProfile={profile} 
    />
  );
}
