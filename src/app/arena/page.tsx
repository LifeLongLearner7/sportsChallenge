import { Suspense } from "react";
import type { Metadata } from "next";
import { getCompletedMatches, getArenaMessages, getUserProfile, getArenaStats } from "@/lib/data-actions";
import ArenaClient from "@/components/ArenaClient";
import Navbar from "@/components/Navbar";
import DashboardSkeleton from "@/components/DashboardSkeleton";

export const metadata: Metadata = {
  title: "The Arena — Human vs AI Battle Stats",
  description:
    "See how humans are performing against the AI across all IPL 2026 predictions. Analyse match-by-match accuracy, global stats, and head-to-head records.",
  alternates: { canonical: "https://sportsaichallenge.com/arena" },
  openGraph: {
    title: "The Arena | Sports AI Challenge",
    description: "Live Human vs AI battle stats across IPL 2026. Who's winning — humans or the machine?",
    url: "https://sportsaichallenge.com/arena",
  },
};

export default async function ArenaPage() {
  // FAST PATH: Shell + Navbar + Profile
  const profile = await getUserProfile();

  return (
    <>
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      <Suspense fallback={<DashboardSkeleton />}>
        <ArenaDataWrapper profile={profile} />
      </Suspense>
    </>
  );
}

async function ArenaDataWrapper({ profile }: { profile: any }) {
  // STREAMING PATH: Tactical data
  const [matches, messages, stats] = await Promise.all([
    getCompletedMatches(),
    getArenaMessages(),
    getArenaStats(),
  ]);

  return (
    <ArenaClient 
      initialMatches={matches}
      initialMessages={messages}
      profile={profile}
      initialStats={stats}
    />
  );
}
