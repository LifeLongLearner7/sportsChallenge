import { Suspense } from "react";
import { getMatches, getUserPredictions, getUserProfile, getGlobalStats, getTotalStrategists, getUserRank } from "@/lib/data-actions";
import DashboardClient from "@/components/DashboardClient";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import Navbar from "@/components/Navbar";

export default async function DashboardPage() {
  // FAST PATH: Fetch profile immediately for the Navbar/HUD Shell
  const profile = await getUserProfile();

  return (
    <>
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDataWrapper profile={profile} />
      </Suspense>
    </>
  );
}

async function DashboardDataWrapper({ profile }: { profile: any }) {
  // STREAMING PATH: Fetch tactical data in parallel
  const [matches, predictions, footballStats, cricketStats, totalUsers] = await Promise.all([
    getMatches(),
    getUserPredictions(),
    getGlobalStats("football"),
    getGlobalStats("cricket"),
    getTotalStrategists(),
  ]);

  // Rank depends on profile, but we can't avoid one short follow-up fetch
  const rank = profile ? await getUserRank(profile.id) : 0;

  return (
    <DashboardClient 
      initialMatches={matches} 
      initialPredictions={predictions} 
      profile={profile} 
      globalStats={{ football: footballStats, cricket: cricketStats }}
      totalUsers={totalUsers}
      rank={rank}
    />
  );
}
