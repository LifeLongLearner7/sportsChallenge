import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Block AI training crawlers ──────────────────────────────────────
      // These scrape content to train models without sending referral traffic.
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "ChatGPT-User", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "anthropic-ai", disallow: "/" },
      { userAgent: "Claude-Web", disallow: "/" },
      { userAgent: "Omgilibot", disallow: "/" },

      // ── Allow AI search bots that generate referral traffic ─────────────
      // Perplexity, SearchGPT, and similar drive real users to the site.
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "YouBot", allow: "/" },

      // ── Standard search engines — full access ───────────────────────────
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "Slurp", allow: "/" }, // Yahoo
      { userAgent: "DuckDuckBot", allow: "/" },
      { userAgent: "Baiduspider", allow: "/" },

      // ── Default: allow all ───────────────────────────────────────────────
      {
        userAgent: "*",
        allow: "/",
        // Keep admin and API routes private from all crawlers
        disallow: ["/admin", "/api/", "/profile/settings"],
      },
    ],
    sitemap: "https://sportsaichallenge.com/sitemap.xml",
  };
}
