import { Metadata } from 'next';
import { getPublicProfile, getUserBraggingStats } from '@/lib/data-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AVATARS, MR_PREDICTO_AVATAR } from '@/lib/constants';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
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

  const selectedAvatar = AVATARS.find(a => a.id === profile.avatar_url) || AVATARS[0];
  const aiAvatar = MR_PREDICTO_AVATAR;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-4xl flex flex-col gap-12 items-center">
        
        <div className="text-center">
           <h1 className="font-headline text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
             {profile.screen_name || "Strategist"}'s Record
           </h1>
           <p className="text-primary font-bold uppercase tracking-[0.2em] text-sm mt-3">
             Public Tactical Dossier
           </p>
        </div>

        {/* Head-to-Head Simple Avatar Showcase */}
        <div className="flex flex-col md:flex-row items-center w-full justify-center gap-12 md:gap-24 relative">
          
          {/* Background Vs Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Player Side */}
          <div className="flex flex-col items-center gap-6 relative z-10">
            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-primary/30 p-2 overflow-hidden shadow-[0_0_30px_rgba(129,236,255,0.2)] ${selectedAvatar.bg}`}>
              {selectedAvatar.path && (
                <img src={selectedAvatar.path} className="w-full h-full object-cover" alt="Player Avatar" />
              )}
            </div>
            <div className="text-center">
              <div className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Winning Streak</div>
              <div className={cn("text-5xl md:text-7xl font-headline font-black italic mt-1 drop-shadow-md", stats.currentStreak >= 3 ? "text-orange-500" : "text-white")}>
                {stats.currentStreak}
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center z-10">
             <div className="text-4xl md:text-6xl font-black italic text-white/10 uppercase font-headline">VS</div>
          </div>

          {/* AI Side */}
          <div className="flex flex-col items-center gap-6 relative z-10">
            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-rose-500/30 p-2 overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.2)] ${aiAvatar.bg}`}>
              {aiAvatar.path && (
                <img src={aiAvatar.path} className="w-full h-full object-cover" alt="AI Avatar" />
              )}
            </div>
            <div className="text-center">
              <div className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">AI Outfoxed</div>
              <div className="text-5xl md:text-7xl font-headline font-black text-tertiary italic mt-1 drop-shadow-md">
                {stats.aiBeatenCount}
              </div>
            </div>
          </div>
          
        </div>

        <div className="flex justify-center mt-12 z-10">
           <Link href="/" className="px-8 py-4 bg-primary text-background font-black uppercase italic rounded-full shadow-[0_0_20px_rgba(129,236,255,0.4)] hover:scale-105 transition-transform">
             Play SportsChallenge Now
           </Link>
        </div>
      </div>
    </div>
  );
}
