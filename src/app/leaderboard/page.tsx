import { getLeaderboard, getUserProfile, getLeaderboardStats, getUserRank } from "@/lib/data-actions";
import LeaderboardClient from "@/components/LeaderboardClient";

export default async function LeaderboardPage() {
  const [rankers, profile, stats] = await Promise.all([
    getLeaderboard(20),
    getUserProfile(),
    getLeaderboardStats(),
  ]);

  // Parallelize the rank fetch IF we have a profile
  const rankPromise = profile ? getUserRank(profile.id) : Promise.resolve(0);
  const rank = await rankPromise;

  const profileWithRank = profile 
    ? { ...profile, rank } 
    : null;

  return <LeaderboardClient rankers={rankers} currentUserProfile={profileWithRank} globalStats={stats} />;
}
