import { getMatches, getUserProfile } from "@/lib/data-actions";
import { redirect } from "next/navigation";
import AdminMatchesClient from "./AdminMatchesClient";

export default async function AdminMatchesPage() {
  const [profile, matches] = await Promise.all([
    getUserProfile(),
    getMatches()
  ]);

  if (!profile || !profile.is_admin) {
    console.warn("UNAUTHORIZED ACCESS: Neural link terminated.");
    redirect("/dashboard");
  }

  return <AdminMatchesClient initialMatches={matches} />;
}
