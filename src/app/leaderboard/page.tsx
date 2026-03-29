import { getLeaderboard, getUserProfile, getLeaderboardStats, getUserRank } from "@/lib/data-actions";
import LeaderboardClient from "@/components/LeaderboardClient";

export default async function LeaderboardPage() {
  const [rankers, profile, stats] = await Promise.all([
    getLeaderboard(20),
    getUserProfile(),
    getLeaderboardStats(),
  ]);

  const rank = profile ? await getUserRank(profile.id) : 0;
  const profileWithRank = profile 
    ? { ...profile, rank } 
    : null;

  return <LeaderboardClient rankers={rankers} currentUserProfile={profileWithRank} globalStats={stats} />;
}
