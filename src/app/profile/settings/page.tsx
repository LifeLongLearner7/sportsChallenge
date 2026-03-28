import { getUserProfile } from "@/lib/data-actions";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const profile = await getUserProfile();

  return <SettingsClient profile={profile} />;
}
