/**
 * Google Analytics event tracking utilities.
 *
 * IMPORTANT: Do NOT pass PII (emails, full user IDs) to GA.
 * We use screen_name (user-chosen alias) and anonymized match identifiers only.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Fire a custom GA4 event.
 */
export function trackEvent(
  eventName: string,
  params: Record<string, string | number | boolean>
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

/**
 * Track when a user submits a prediction.
 * @param screenName  - The user's chosen arena name (NOT email)
 * @param matchId     - Short match identifier (first 8 chars)
 * @param teamA       - Team A name
 * @param teamB       - Team B name
 * @param chosenTeam  - The team the user predicted to win
 */
export function trackPredictionSubmitted({
  screenName,
  matchId,
  teamA,
  teamB,
  chosenTeam,
}: {
  screenName: string;
  matchId: string;
  teamA: string;
  teamB: string;
  chosenTeam: string;
}) {
  trackEvent("prediction_submitted", {
    strategist: screenName,               // e.g. "ShadowFox"
    match: `${teamA} vs ${teamB}`,        // e.g. "CSK vs RCB"
    match_id_short: matchId.slice(0, 8),  // anonymized — not a full UUID
    chosen_team: chosenTeam,              // e.g. "CSK"
  });
}
