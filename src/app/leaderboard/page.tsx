import { Suspense } from "react";
import type { Metadata } from "next";
import { getLeaderboard, getLeaderboardStats, getUserProfile } from "@/lib/data-actions";
import LeaderboardClient from "@/components/LeaderboardClient";
import Navbar from "@/components/Navbar";
import DashboardSkeleton from "@/components/DashboardSkeleton";

export const metadata: Metadata = {
  title: "Global Leaderboard — Top IPL Predictors",
  description:
    "Climb the global leaderboard by beating our AI on IPL 2026 match predictions. See who the top cricket strategists are and where you rank.",
  alternates: { canonical: "https://sportsaichallenge.com/leaderboard" },
  openGraph: {
    title: "Global Leaderboard | Sports AI Challenge",
    description: "Who's the best cricket predictor on the planet? Check the live IPL 2026 leaderboard.",
    url: "https://sportsaichallenge.com/leaderboard",
  },
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: { tournament?: string };
}) {
  const tournament = searchParams?.tournament || "fifa_wc_2026";
  
  // FAST PATH: Shell + Navbar + Profile
  const profile = await getUserProfile();

  return (
    <>
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      <Suspense fallback={<DashboardSkeleton />}>
        <LeaderboardDataWrapper profile={profile} tournament={tournament} />
      </Suspense>
    </>
  );
}

async function LeaderboardDataWrapper({ profile, tournament }: { profile: any, tournament: string }) {
  // STREAMING PATH: Rankings + Stats
  const [leaderboard, stats] = await Promise.all([
    getLeaderboard(tournament),
    getLeaderboardStats(),
  ]);

  return (
    <LeaderboardClient 
      initialProfiles={leaderboard} 
      stats={stats}
      currentUserProfile={profile}
      activeTournament={tournament}
    />
  );
}
