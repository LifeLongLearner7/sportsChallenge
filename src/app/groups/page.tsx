import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserProfile } from "@/lib/data-actions";
import { getMyGroups } from "@/lib/group-actions";
import { createClient } from "@/lib/auth-actions";
import GroupsClient from "@/components/GroupsClient";
import Navbar from "@/components/Navbar";
import DashboardSkeleton from "@/components/DashboardSkeleton";

export const metadata: Metadata = {
  title: "My Groups — Private Prediction Leagues",
  description:
    "Create or join private sports prediction leagues. Compete with friends and see who the top predictor in your group is.",
  alternates: { canonical: "https://sportsaichallenge.com/groups" },
  openGraph: {
    title: "Private Leagues | Sports AI Challenge",
    description:
      "Form private prediction leagues with friends. Share an invite code, compete on the leaderboard, dominate.",
    url: "https://sportsaichallenge.com/groups",
  },
};

export default async function GroupsPage() {
  const profile = await getUserProfile();

  return (
    <>
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      <Suspense fallback={<DashboardSkeleton />}>
        <GroupsDataWrapper profile={profile} />
      </Suspense>
    </>
  );
}

async function GroupsDataWrapper({ profile }: { profile: any }) {
  // Require authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const groups = await getMyGroups();

  return (
    <GroupsClient
      groups={groups}
      currentUserId={user.id}
      profile={profile}
    />
  );
}
