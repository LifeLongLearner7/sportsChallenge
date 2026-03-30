import { getLeaderboard, getUserProfile, getLeaderboardStats, getUserRank, getTotalStrategists } from "@/lib/data-actions";
import LeaderboardClient from "@/components/LeaderboardClient";

export default async function LeaderboardPage() {
  const [rankers, profile, stats, totalUsers] = await Promise.all([
    getLeaderboard(20),
    getUserProfile(),
    getLeaderboardStats(),
    getTotalStrategists(),
  ]);

  // Parallelize the rank fetch IF we have a profile
  const rankPromise = profile ? getUserRank(profile.id) : Promise.resolve(0);
  const rank = await rankPromise;

  const profileWithRank = profile 
    ? { ...profile, rank } 
    : null;

  return (
    <LeaderboardClient 
      rankers={rankers} 
      currentUserProfile={profileWithRank} 
      globalStats={stats} 
      totalUsers={totalUsers}
    />
  );
}
