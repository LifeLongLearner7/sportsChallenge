import { getLeaderboard, getUserProfile, getLeaderboardStats } from "@/lib/data-actions";
import LeaderboardClient from "@/components/LeaderboardClient";

export default async function LeaderboardPage() {
  const [rankers, profile, stats] = await Promise.all([
    getLeaderboard(20),
    getUserProfile(),
    getLeaderboardStats(),
  ]);

  return <LeaderboardClient rankers={rankers} currentUserProfile={profile} globalStats={stats} />;
}
