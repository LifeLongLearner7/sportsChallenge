import { Suspense } from "react";
import { getCompletedMatches, getArenaMessages, getUserProfile, getArenaStats } from "@/lib/data-actions";
import ArenaClient from "@/components/ArenaClient";
import Navbar from "@/components/Navbar";
import DashboardSkeleton from "@/components/DashboardSkeleton";

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
