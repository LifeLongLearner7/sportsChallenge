import { getMatches, getUserPredictions, getUserProfile, getGlobalStats, getTotalStrategists, getUserRank } from "@/lib/data-actions";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const profile = await getUserProfile();
  
  const [matches, predictions, globalStats, totalUsers, rank] = await Promise.all([
    getMatches(),
    getUserPredictions(),
    getGlobalStats(),
    getTotalStrategists(),
    profile ? getUserRank(profile.id) : Promise.resolve(0)
  ]);

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
