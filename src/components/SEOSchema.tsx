/**
 * JSON-LD Structured Data for Google Rich Snippets.
 * Rendered as a server component — zero client-side JS cost.
 */
export default function SEOSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://sportsaichallenge.com/#website",
        name: "Sports AI Challenge",
        url: "https://sportsaichallenge.com",
        description:
          "Predict IPL 2026 cricket match outcomes and compete against an AI model. Free to play, no gambling.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://sportsaichallenge.com/leaderboard?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SportsOrganization",
        "@id": "https://sportsaichallenge.com/#org",
        name: "Sports AI Challenge",
        url: "https://sportsaichallenge.com",
        logo: {
          "@type": "ImageObject",
          url: "https://sportsaichallenge.com/logo.png",
        },
        sport: "Cricket",
        description:
          "An AI-powered cricket prediction platform where humans challenge a machine learning model to predict IPL 2026 match outcomes.",
      },
      {
        "@type": "Game",
        "@id": "https://sportsaichallenge.com/#game",
        name: "Sports AI Challenge",
        url: "https://sportsaichallenge.com",
        description:
          "Predict IPL 2026 match winners before the AI does. Build streaks, beat Mr. Predicto, and rise on the global leaderboard.",
        genre: ["Sports", "Strategy", "Prediction"],
        isFamilyFriendly: true,
        numberOfPlayers: {
          "@type": "QuantitativeValue",
          minValue: 1,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
