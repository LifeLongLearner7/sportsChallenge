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
 */
export async function fetchRecentResults() {
  if (!API_KEY) {
    console.warn("API Error: CRICKET_ORG_API_KEY is missing.");
    return [];
  }

  try {
    // 1. Try /currentMatches first
    const response = await fetch(`${BASE_URL}/currentMatches?apikey=${API_KEY}`);
    const data = await response.json();

    if (data.status !== "success") {
       console.error("API Error (Current):", data.reason || "Unknown API error");
    }

    let results = data.data || [];

    // 2. If nothing found or to be sure, check /matches (recent history)
    const histResponse = await fetch(`${BASE_URL}/matches?apikey=${API_KEY}&offset=0`);
    const histData = await histResponse.json();
    
    if (histData.status === "success" && histData.data) {
       // Merge results, avoiding duplicates by ID
       const existingIds = new Set(results.map((m: any) => m.id));
       histData.data.forEach((m: any) => {
         if (!existingIds.has(m.id)) {
            results.push(m);
         }
       });
    }

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
  if (!externalMatch.matchEnded && !externalMatch.status.toLowerCase().includes("won")) return null;

  const status = externalMatch.status.toLowerCase();
  
  // Get all possible aliases for teamA and teamB
  const aliasesA = [teamA, ...(TEAM_MAPPINGS[teamA] || [])].map(a => a.toLowerCase());
  const aliasesB = [teamB, ...(TEAM_MAPPINGS[teamB] || [])].map(b => b.toLowerCase());

  const matchesA = aliasesA.some(alias => status.includes(alias));
  const matchesB = aliasesB.some(alias => status.includes(alias));

  if (matchesA && !matchesB) return "team_a";
  if (matchesB && !matchesA) return "team_b";

  return null;
}

