"use client";

import { Share2, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ShareButtonsProps {
  currentStreak: number;
  aiBeatenCount: number;
  userId: string;
}

export default function ShareButtons({ currentStreak, aiBeatenCount, userId }: ShareButtonsProps) {
  const [isCopied, setIsCopied] = useState(false);

  // Using the official web URL with the specific public status page
  const url = `https://sports-challenge.vercel.app/status/${userId}`;

  const shareText = `🔥 I'm on a ${currentStreak}-match winning streak on SportsChallenge! I've also outfoxed Mr. Predicto ${aiBeatenCount} times. Can you beat my predictive prowess? 🏆`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My SportsChallenge Stats",
          text: shareText,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\nJoin here: ${url}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Native Web Share API (Primary for Mobile) */}
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-xl text-primary font-bold transition-all"
        title="Share your stats"
      >
        <Share2 size={16} />
        <span className="text-xs uppercase tracking-wider">Broadcast</span>
      </button>

      {/* Social Links (Desktop Fallbacks) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl text-[#25D366] font-bold transition-all"
        title="Share on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-whatsapp"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
      </a>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-2 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 rounded-xl text-[#0A66C2] font-bold transition-all"
        title="Share on LinkedIn"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
      </a>

      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 rounded-xl text-[#1877F2] font-bold transition-all"
        title="Share on Facebook"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className={cn(
          "px-3 py-2 border rounded-xl font-bold transition-all flex items-center gap-2",
          isCopied 
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
            : "bg-surface-container/50 hover:bg-surface-container border-white/10 text-slate-300"
        )}
        title="Copy to clipboard (for Instagram, etc.)"
      >
        <LinkIcon size={16} />
        <span className="text-xs uppercase tracking-wider hidden sm:inline">{isCopied ? "Copied!" : "Copy Link"}</span>
      </button>

    </div>
  );
}
