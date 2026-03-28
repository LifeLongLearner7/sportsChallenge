import { getUserProfile, getCompletedMatches, getArenaMessages, getGlobalStats } from "@/lib/data-actions";
import ArenaClient from "@/components/ArenaClient";
import { redirect } from "next/navigation";

export default async function ArenaPage() {
  const [profile, completedMatches, initialMessages, globalStats] = await Promise.all([
    getUserProfile(),
    getCompletedMatches(),
    getArenaMessages(),
    getGlobalStats()
  ]);

  if (!profile) {
    redirect("/auth");
  }

  return (
    <ArenaClient 
      profile={profile}
      completedMatches={completedMatches}
      initialMessages={initialMessages}
      globalStats={globalStats}
    />
  );
}
