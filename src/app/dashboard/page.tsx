import { getMatches, getUserPredictions, getUserProfile, getGlobalStats } from "@/lib/data-actions";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const [matches, predictions, profile, globalStats] = await Promise.all([
    getMatches(),
    getUserPredictions(),
    getUserProfile(),
    getGlobalStats(),
  ]);

  return (
    <DashboardClient 
      initialMatches={matches} 
      initialPredictions={predictions} 
      profile={profile} 
      globalStats={globalStats}
    />
  );
}
