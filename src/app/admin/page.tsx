import { getUserProfile, getAdminAnalytics, getMatches, getTotalStrategists } from "@/lib/data-actions";
import AdminClient from "@/components/AdminClient";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const [profile, analytics, matches, totalUsers] = await Promise.all([
     getUserProfile(),
     getAdminAnalytics(),
     getMatches(),
     getTotalStrategists(),
  ]);

  if (!profile) {
    redirect("/auth");
  }

  const completedMatches = matches.filter(m => m.status === "completed");

  return <AdminClient profile={profile} analytics={analytics} completedMatches={completedMatches} totalUsers={totalUsers} />;
}

