import { getUserProfile, getAdminAnalytics } from "@/lib/data-actions";
import AdminClient from "@/components/AdminClient";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const [profile, analytics] = await Promise.all([
     getUserProfile(),
     getAdminAnalytics()
  ]);

  if (!profile) {
    redirect("/auth");
  }

  return <AdminClient profile={profile} analytics={analytics} />;
}
