import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserProfile } from "@/lib/data-actions";
import { getGroupLeaderboard } from "@/lib/group-actions";
import GroupDetailClient from "@/components/GroupDetailClient";
import Navbar from "@/components/Navbar";
import DashboardSkeleton from "@/components/DashboardSkeleton";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Group League — Private Standings",
    description: "View your private prediction league standings.",
    alternates: { canonical: `https://sportsaichallenge.com/groups/${id}` },
  };
}

export default async function GroupDetailPage({ params }: GroupPageProps) {
  const { id } = await params;
  const profile = await getUserProfile();

  return (
    <>
      <Navbar isAdmin={profile?.is_admin} profile={profile} />
      <Suspense fallback={<DashboardSkeleton />}>
        <GroupDetailDataWrapper groupId={id} />
      </Suspense>
    </>
  );
}

async function GroupDetailDataWrapper({ groupId }: { groupId: string }) {
  const { group, members, currentUserId } = await getGroupLeaderboard(groupId);

  // Group not found OR user is not a member — redirect away
  if (!group || !currentUserId) {
    redirect("/groups");
  }

  return (
    <GroupDetailClient
      group={group}
      members={members}
      currentUserId={currentUserId}
    />
  );
}
