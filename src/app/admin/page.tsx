import { getUserProfile, getAdminAnalytics, getMatches } from "@/lib/data-actions";
import AdminClient from "@/components/AdminClient";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const [profile, analytics, matches] = await Promise.all([
     getUserProfile(),
     getAdminAnalytics(),
     getMatches()
  ]);

  if (!profile) {
    redirect("/auth");
  }

  const completedMatches = matches.filter(m => m.status === "completed");

  return <AdminClient profile={profile} analytics={analytics} completedMatches={completedMatches} />;
}

