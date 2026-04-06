/**
 * Service for interacting with CricketData.org API
 */

const API_KEY = process.env.CRICKET_ORG_API_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

export interface ExternalMatch {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  teams: string[];
  score: any[];
  series_id: string;
  matchStarted: boolean;
  matchEnded: boolean;
}

export const TEAM_MAPPINGS: Record<string, string[]> = {
  "RCB": ["Royal Challengers Bangalore", "Royal Challengers Bengaluru", "RCB"],
  "SRH": ["Sunrisers Hyderabad", "SRH"],
  "CSK": ["Chennai Super Kings", "CSK"],
  "MI": ["Mumbai Indians", "MI"],
  "KKR": ["Kolkata Knight Riders", "KKR"],
  "RR": ["Rajasthan Royals", "RR"],
  "DC": ["Delhi Capitals", "DC"],
  "GT": ["Gujarat Titans", "GT"],
  "LSG": ["Lucknow Super Giants", "LSG"],
  "PBKS": ["Punjab Kings", "PBKS"]
};


/**
 * Fetches recent match results from the API.
 * Uses Deep Lookup (Multi-Offset) to find matches even if they've rotated out of the primary window.
 */
export async function fetchRecentResults() {
  if (!API_KEY) {
    console.warn("API Error: CRICKET_ORG_API_KEY is missing.");
    return [];
  }

  try {
    const results: any[] = [];
    const seenIds = new Set<string>();

    // 1. Primary Pulse: Current Active Matches
    const currResponse = await fetch(`${BASE_URL}/currentMatches?apikey=${API_KEY}`);
    const currData = await currResponse.json();
    if (currData.status === "success" && currData.data) {
      currData.data.forEach((m: any) => {
        if (!seenIds.has(m.id)) {
          results.push(m);
          seenIds.add(m.id);
        }
      });
    }

    // 2. Deep History Pulse: Scour offsets 0, 25, and 50 to find fixtures from the last 72H
    const offsets = [0, 25, 50];
    for (const offset of offsets) {
      const histResponse = await fetch(`${BASE_URL}/matches?apikey=${API_KEY}&offset=${offset}`);
      const histData = await histResponse.json();
      
      if (histData.status === "success" && histData.data) {
        histData.data.forEach((m: any) => {
          if (!seenIds.has(m.id)) {
            results.push(m);
            seenIds.add(m.id);
          }
        });
      }
    }

    console.log(`Strategic Pulse: Deep Lookup retrieved ${results.length} unique match nodes across 3 offsets.`);
    return results as ExternalMatch[];
  } catch (error) {
    console.error("Network Error fetching match results:", error);
    return [];
  }
}

/**
 * Parses the winner from an external match object.
 * Returns 'team_a', 'team_b', or null.
 * logic:
 * - Usually the status contains "won by"
 */
export function determineWinner(externalMatch: ExternalMatch, teamA: string, teamB: string): "team_a" | "team_b" | null {
  const status = (externalMatch.status || "").toLowerCase();
  
  // High-Fidelity Validation: Only proceed if match has ended or has a definitive winner string
  if (!externalMatch.matchEnded && !status.includes("won") && !status.includes("beat")) return null;

  // 1. Keyword-Anchor Logic: Identify the SUBJECT of the win
  // Pattern: "Team Name won" or "Team Name beat"
  const aliasesA = [teamA, ...(TEAM_MAPPINGS[teamA] || [])].map(a => a.toLowerCase());
  const aliasesB = [teamB, ...(TEAM_MAPPINGS[teamB] || [])].map(b => b.toLowerCase());

  for (const alias of aliasesA) {
    if (status.includes(`${alias} won`) || status.includes(`${alias} beat`)) return "team_a";
  }
  for (const alias of aliasesB) {
    if (status.includes(`${alias} won`) || status.includes(`${alias} beat`)) return "team_b";
  }

  // 2. Fallback Logic: Simple presence check iff only ONE team is mentioned
  const matchesA = aliasesA.some(alias => status.includes(alias));
  const matchesB = aliasesB.some(alias => status.includes(alias));

  if (matchesA && !matchesB) return "team_a";
  if (matchesB && !matchesA) return "team_b";

  return null;
}

/**
 * Fetches high-fidelity details for a specific match.
 */
export async function fetchMatchInfo(externalId: string) {
  if (!API_KEY) return null;

  try {
    const response = await fetch(`${BASE_URL}/match_info?apikey=${API_KEY}&id=${externalId}`);
    const result = await response.json();

    if (result.status !== "success") {
      console.error(`API Error for Match ${externalId}:`, result.reason);
      return null;
    }

    return result.data as ExternalMatch;
  } catch (error) {
    console.error(`Network Error fetching Match ${externalId}:`, error);
    return null;
  }
}

