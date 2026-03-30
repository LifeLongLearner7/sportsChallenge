import { getMatches, getUserPredictions, getUserProfile, getGlobalStats, getTotalStrategists, getUserRank } from "@/lib/data-actions";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  // Parallelize all data fetching including the profile
  const [matches, predictions, profile, globalStats, totalUsers] = await Promise.all([
    getMatches(),
    getUserPredictions(),
    getUserProfile(),
    getGlobalStats(),
    getTotalStrategists(),
  ]);

  // Rank depends on profile, but we can't avoid one short follow-up fetch if we want accuracy.
  // However, getUserRank is cached for 8 hours, so this will be nearly 0ms after the first hit.
  const rank = profile ? await getUserRank(profile.id) : 0;

  return (
    <DashboardClient 
      initialMatches={matches} 
      initialPredictions={predictions} 
      profile={profile} 
      globalStats={globalStats}
      totalUsers={totalUsers}
      rank={rank}
    />
  );
}
