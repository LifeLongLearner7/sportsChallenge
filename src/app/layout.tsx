import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const SITE_URL = "https://sportsaichallenge.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sports AI Challenge | Predict IPL Matches & Beat the AI",
    template: "%s | Sports AI Challenge",
  },
  description:
    "Challenge an AI to predict IPL 2026 match outcomes. Build your streak, climb the leaderboard, and prove humans can outsmart machine learning. Free to play.",
  keywords: [
    "IPL 2026 predictions",
    "cricket AI prediction",
    "predict IPL matches",
    "sports prediction game",
    "human vs AI cricket",
    "IPL fantasy prediction",
    "cricket strategy game",
    "beat the AI",
  ],
  authors: [{ name: "Sports AI Challenge", url: SITE_URL }],
  creator: "Sports AI Challenge",
  publisher: "Sports AI Challenge",
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: "Sports AI Challenge",
    title: "Sports AI Challenge | Predict IPL Matches & Beat the AI",
    description:
      "Challenge our AI model to predict IPL 2026 outcomes. Free to play — no gambling, pure strategy.",
    url: SITE_URL,
    images: [
      {
        url: "/assets/og-default.png",
        width: 1200,
        height: 630,
        alt: "Sports AI Challenge — Humans vs AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sports AI Challenge | Predict IPL Matches & Beat the AI",
    description:
      "Challenge our AI model to predict IPL 2026 outcomes. Free to play — no gambling, pure strategy.",
    images: ["/assets/og-default.png"],
    creator: "@sportsaichallenge",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} font-body bg-background text-foreground antialiased min-h-screen overflow-x-hidden`}>
        {children}
        <Analytics />
        <SpeedInsights />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QLR8PKQ8PZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QLR8PKQ8PZ');
          `}
        </Script>
      </body>
    </html>
  );
}
