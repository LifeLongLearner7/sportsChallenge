import { Metadata } from 'next';
import { getPublicProfile, getUserBraggingStats } from '@/lib/data-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BraggingRightsCard from '@/components/BraggingRightsCard';

export const revalidate = 1800; // Cache this page broadly 

interface Props {
  params: { userId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPublicProfile(params.userId);
  if (!profile || profile.id !== params.userId) return {};

  const stats = await getUserBraggingStats(params.userId);

  const baseUrl = "https://sports-challenge.vercel.app";
  
  // Construct the dynamic image URL (Sanitize string inputs just in case)
  const safeName = encodeURIComponent((profile.screen_name || "Strategist").slice(0, 20));
  const ogUrl = new URL(`/api/og/brag?s=${stats.currentStreak}&a=${stats.aiBeatenCount}&av=${profile.avatar_url}&name=${safeName}`, baseUrl);

  const title = `${profile.screen_name || "Strategist"}'s Predictive Stats`;
  const description = `🔥 ${stats.currentStreak}-match winning streak! ${stats.aiBeatenCount} times outfoxing Mr. Predicto. Can you beat this record?`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${profile.screen_name || "Strategist"} vs Mr. Predicto`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl.toString()],
    },
  };
}

export default async function PublicStatusPage({ params }: Props) {
  const profile = await getPublicProfile(params.userId);
  if (!profile || profile.id !== params.userId) notFound();

  const stats = await getUserBraggingStats(params.userId);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        <div className="text-center">
           <h1 className="font-headline text-3xl font-black text-white italic uppercase tracking-tighter">
             {profile.screen_name || "Strategist"}'s Record
           </h1>
           <p className="text-primary font-bold uppercase tracking-widest text-xs mt-2">
             Public Tactical Dossier
           </p>
        </div>

        {/* Display the same stats card to public viewers */}
        <BraggingRightsCard 
           currentStreak={stats.currentStreak} 
           aiBeatenCount={stats.aiBeatenCount}
           userId={params.userId}
        />

        <div className="flex justify-center mt-6">
           <Link href="/" className="px-8 py-4 bg-primary text-background font-black uppercase italic rounded-full shadow-[0_0_20px_rgba(129,236,255,0.4)] hover:scale-105 transition-transform">
             Play SportsChallenge Now
           </Link>
        </div>
      </div>
    </div>
  );
}
