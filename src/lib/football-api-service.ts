import https from "https";

/**
 * FOOTBALL API SERVICE (v2.0)
 * Handles all communication with football-data.org for FIFA World Cup 2026.
 */

const API_KEY = process.env.FOOTBALL_API_KEY;
const BASE_URL = "https://api.football-data.org/v4";

export const FIFA_LEAGUE_ID = 2000; // WC ID on football-data.org is 2000 or 'WC'
export const FIFA_SEASON = 2026;

// ── TEAM MAPPINGS ──────────────────────────────────────────────────────────────
// Maps our internal short codes to the various name formats the API may return.
export const FIFA_TEAM_MAPPINGS: Record<string, string[]> = {
  "ARG": ["Argentina", "ARG"],
  "AUS": ["Australia", "AUS"],
  "BEL": ["Belgium", "BEL"],
  "BRA": ["Brazil", "Brasil", "BRA"],
  "CAN": ["Canada", "CAN"],
  "CMR": ["Cameroon", "CMR"],
  "CRC": ["Costa Rica", "CRC"],
  "CRO": ["Croatia", "CRO", "Hrvatska"],
  "DEN": ["Denmark", "DEN"],
  "ECU": ["Ecuador", "ECU"],
  "ENG": ["England", "ENG"],
  "ESP": ["Spain", "ESP"],
  "FRA": ["France", "FRA"],
  "GAB": ["Gabon", "GAB"],
  "GER": ["Germany", "GER"],
  "GHA": ["Ghana", "GHA"],
  "IRN": ["Iran", "IRN"],
  "JPN": ["Japan", "JPN"],
  "KOR": ["South Korea", "Korea Republic", "KOR"],
  "KSA": ["Saudi Arabia", "KSA"],
  "MAR": ["Morocco", "MAR"],
  "MEX": ["Mexico", "MEX"],
  "NED": ["Netherlands", "Holland", "NED"],
  "NGA": ["Nigeria", "NGA"],
  "POR": ["Portugal", "POR"],
  "POL": ["Poland", "POL"],
  "QAT": ["Qatar", "QAT"],
  "SEN": ["Senegal", "SEN"],
  "SRB": ["Serbia", "SRB"],
  "SUI": ["Switzerland", "SUI"],
  "TUN": ["Tunisia", "TUN"],
  "URU": ["Uruguay", "URU"],
  "USA": ["United States", "United States of America", "USA"],
  "WAL": ["Wales", "WAL"],
  "PAN": ["Panama", "PAN"],
  "ALB": ["Albania", "ALB"],
  "AUT": ["Austria", "AUT"],
  "CZE": ["Czech Republic", "Czechia", "CZE"],
  "GRE": ["Greece", "GRE"],
  "HUN": ["Hungary", "HUN"],
  "IRL": ["Ireland", "Republic of Ireland", "IRL"],
  "NOR": ["Norway", "NOR"],
  "ROU": ["Romania", "ROU"],
  "SCO": ["Scotland", "SCO"],
  "SVK": ["Slovakia", "SVK"],
  "SWE": ["Sweden", "SWE"],
  "TUR": ["Turkey", "Türkiye", "TUR"],
  "UKR": ["Ukraine", "UKR"],
  "COL": ["Colombia", "COL"],
  "VEN": ["Venezuela", "VEN"],
  "CHI": ["Chile", "CHI"],
  "BOL": ["Bolivia", "BOL"],
  "PER": ["Peru", "PER"],
  "PAR": ["Paraguay", "PAR"],
  "EGY": ["Egypt", "EGY"],
  "CIV": ["Ivory Coast", "Côte d'Ivoire", "CIV"],
  "MLI": ["Mali", "MLI"],
  "COD": ["DR Congo", "Congo DR", "COD"],
  "ALG": ["Algeria", "ALG"],
  "NZL": ["New Zealand", "NZL"],
  "FIJ": ["Fiji", "FIJ"],
  "RSA": ["South Africa", "RSA", "ZAF", "SOU"],
  "BIH": ["Bosnia and Herzegovina", "Bosnia", "BIH", "BOS"],
  "ITA": ["Italy", "Italia", "ITA"],
};

// ── INTERFACES ─────────────────────────────────────────────────────────────────
export interface FootballFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;   // e.g. "Match Finished", "Not Started"
      short: string;  // e.g. "FT", "NS"
      elapsed: number | null;
    };
    venue: {
      name: string;
      city: string;
    };
  };
  league: {
    id: number;
    name: string;
    round: string; // e.g. "Group Stage - 1", "Quarter-finals"
  };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
function getHeaders() {
  return {
    "X-Auth-Token": API_KEY!,
    "Content-Type": "application/json",
    "User-Agent": "SportsAIChallenge/1.0 (sportsaichallenge@gmail.com)",
    "Connection": "close"
  };
}

function httpsRequest(url: string, headers: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: headers,
    };

    const req = https.get(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON response: ${data}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}

function mapToFootballFixture(fdMatch: any): FootballFixture {
  const isFinished = fdMatch.status === "FINISHED";
  
  // score.winner is HOME_TEAM, AWAY_TEAM, or DRAW
  const homeWinner = fdMatch.score?.winner === "HOME_TEAM" ? true : (fdMatch.score?.winner === "AWAY_TEAM" ? false : null);
  const awayWinner = fdMatch.score?.winner === "AWAY_TEAM" ? true : (fdMatch.score?.winner === "HOME_TEAM" ? false : null);

  // Map status to short code for our determination logic: FT or NS
  let statusShort = "NS";
  if (fdMatch.status === "FINISHED") {
    statusShort = "FT";
  } else if (fdMatch.status === "IN_PLAY" || fdMatch.status === "PAUSED") {
    statusShort = "LIVE";
  }

  // Get venue name/city
  const venueParts = (fdMatch.venue || "").split(",");
  const venueName = venueParts[0]?.trim() || "TBD";
  const venueCity = venueParts[1]?.trim() || "TBD";

  // Map stage/round
  let round = fdMatch.stage || "Group Stage";
  if (fdMatch.group) {
    // e.g. GROUP_A -> GROUP A
    const formattedGroup = fdMatch.group.replace("_", " ");
    round = `${round} - ${formattedGroup}`;
  }

  return {
    fixture: {
      id: fdMatch.id,
      date: fdMatch.utcDate,
      status: {
        long: fdMatch.status,
        short: statusShort,
        elapsed: isFinished ? 90 : null
      },
      venue: {
        name: venueName,
        city: venueCity
      }
    },
    league: {
      id: fdMatch.competition?.id || 2000,
      name: fdMatch.competition?.name || "World Cup",
      round: round
    },
    teams: {
      home: {
        id: fdMatch.homeTeam?.id || 0,
        name: fdMatch.homeTeam?.name || fdMatch.homeTeam?.shortName || "TBD",
        winner: homeWinner
      },
      away: {
        id: fdMatch.awayTeam?.id || 0,
        name: fdMatch.awayTeam?.name || fdMatch.awayTeam?.shortName || "TBD",
        winner: awayWinner
      }
    },
    goals: {
      home: fdMatch.score?.fullTime?.home ?? null,
      away: fdMatch.score?.fullTime?.away ?? null
    }
  };
}

/**
 * Fetches all FIFA World Cup 2026 fixtures.
 */
export async function fetchAllFifaFixtures(): Promise<FootballFixture[]> {
  if (!API_KEY) {
    console.warn("FOOTBALL API: FOOTBALL_API_KEY is missing.");
    return [];
  }

  try {
    const url = `${BASE_URL}/competitions/WC/matches`;
    const data = await httpsRequest(url, getHeaders());

    if (data.message || data.error) {
      console.error("FOOTBALL API (football-data.org) Error:", data.message || data.error);
      return [];
    }

    const matches = data.matches || [];
    console.log(`FIFA Sync: Fetched ${matches.length} matches from football-data.org.`);
    return matches.map(mapToFootballFixture);
  } catch (err: any) {
    console.error("FOOTBALL API: Network error fetching fixtures:", err);
    return [];
  }
}

/**
 * Fetches details for a single fixture by its external ID.
 */
export async function fetchFifaFixtureById(fixtureId: number): Promise<FootballFixture | null> {
  if (!API_KEY) return null;

  try {
    const url = `${BASE_URL}/matches/${fixtureId}`;
    const data = await httpsRequest(url, getHeaders());

    if (data.message || data.error) {
      console.error(`FOOTBALL API Error for fixture ${fixtureId}:`, data.message || data.error);
      return null;
    }

    return mapToFootballFixture(data);
  } catch (err) {
    console.error(`FOOTBALL API: Error fetching fixture ${fixtureId}:`, err);
    return null;
  }
}

/**
 * Fetches only recently finished FIFA fixtures.
 * Used by the result sync cron to detect new results.
 */
export async function fetchRecentFifaResults(): Promise<FootballFixture[]> {
  if (!API_KEY) return [];

  try {
    const url = `${BASE_URL}/competitions/WC/matches?status=FINISHED`;
    const data = await httpsRequest(url, getHeaders());

    if (data.message || data.error) {
      console.error("FOOTBALL API Error:", data.message || data.error);
      return [];
    }

    const matches = data.matches || [];
    return matches.map(mapToFootballFixture);
  } catch (err) {
    console.error("FOOTBALL API: Error fetching recent results:", err);
    return [];
  }
}

/**
 * Determines the winner or draw from a finished fixture.
 * Returns 'team_a', 'team_b', 'draw', or null (if not finished).
 */
export function determineFifaWinner(
  fixture: FootballFixture,
  teamA: string,
  teamB: string
): "team_a" | "team_b" | "draw" | null {
  const status = fixture.fixture.status.short;

  // Only process finished matches
  const finishedStatuses = ["FT", "AET", "PEN", "LIVE"]; // We check statusShort maps FINISHED to "FT"
  // Wait, if status is LIVE/NS it's not finished. Only process "FT".
  if (status !== "FT") return null;

  const homeWinner = fixture.teams.home.winner; // true / false / null
  const awayWinner = fixture.teams.away.winner; // true / false / null

  if (homeWinner === true) {
    return matchTeamToSide(fixture.teams.home.name, teamA, teamB);
  } else if (awayWinner === true) {
    return matchTeamToSide(fixture.teams.away.name, teamA, teamB);
  } else if (homeWinner === null && awayWinner === null) {
    // Both null in a finished match means a draw
    return "draw";
  }

  // Fallback to goals just in case
  const homeGoals = fixture.goals.home;
  const awayGoals = fixture.goals.away;

  if (homeGoals === null || awayGoals === null) return null;

  if (homeGoals === awayGoals) return "draw";

  if (homeGoals > awayGoals) {
    return matchTeamToSide(fixture.teams.home.name, teamA, teamB);
  } else {
    return matchTeamToSide(fixture.teams.away.name, teamA, teamB);
  }
}

/**
 * Matches an API team name back to our internal team_a / team_b sides.
 */
function matchTeamToSide(
  apiTeamName: string,
  teamA: string,
  teamB: string
): "team_a" | "team_b" | null {
  const apiName = apiTeamName.toLowerCase();

  const aliasesA = [teamA, ...(FIFA_TEAM_MAPPINGS[teamA] || [])].map((a) => a.toLowerCase());
  const aliasesB = [teamB, ...(FIFA_TEAM_MAPPINGS[teamB] || [])].map((b) => b.toLowerCase());

  if (aliasesA.some((a) => apiName.includes(a) || a.includes(apiName))) return "team_a";
  if (aliasesB.some((b) => apiName.includes(b) || b.includes(apiName))) return "team_b";

  return null;
}
