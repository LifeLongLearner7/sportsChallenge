import { getUserProfile } from "@/lib/data-actions";
import ProfileLayoutClient from "./ProfileLayoutClient";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();

  return (
    <ProfileLayoutClient profile={profile}>
      {children}
    </ProfileLayoutClient>
  );
}
