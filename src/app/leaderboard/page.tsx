import { getLeaderboard, getUserProfile } from "@/lib/data-actions";
import LeaderboardClient from "@/components/LeaderboardClient";

export default async function LeaderboardPage() {
  const [rankers, profile] = await Promise.all([
    getLeaderboard(20),
    getUserProfile(),
  ]);

  return <LeaderboardClient rankers={rankers} currentUserProfile={profile} />;
}
