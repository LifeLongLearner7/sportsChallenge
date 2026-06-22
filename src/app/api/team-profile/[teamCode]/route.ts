import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { FIFA_TEAM_MAPPINGS } from "@/lib/football-api-service";
import https from "https";

const API_KEY = process.env.FOOTBALL_API_KEY;
const BASE_URL = "https://api.football-data.org/v4";

function httpsGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "X-Auth-Token": API_KEY!, "Connection": "close" } }, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { reject(new Error("JSON parse error")); }
      });
    });
    req.on("error", reject);
  });
}

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Derive position groups and return top 6 players
function selectTopPlayers(squad: any[]): any[] {
  const gks   = squad.filter(p => p.position === "Goalkeeper").slice(0, 1);
  const defs  = squad.filter(p => p.position === "Defence").slice(0, 2);
  const mids  = squad.filter(p => p.position === "Midfield").slice(0, 2);
  const fwds  = squad.filter(p => p.position === "Offence").slice(0, 1);
  return [...gks, ...defs, ...mids, ...fwds].map(p => ({
    name: p.name,
    position: p.position,
    dateOfBirth: p.dateOfBirth,
    nationality: p.nationality,
  }));
}

// ── CACHED LIVE DATA (1 hour TTL) ──────────────────────────────────────────────

const getStandingsAndResults = unstable_cache(
  async (teamCode: string, externalId: number) => {
    // 1. Standings
    const standingsData = await httpsGet(`${BASE_URL}/competitions/WC/standings`);
    let standing: any = null;
    let groupName = "";
    for (const group of (standingsData.standings || [])) {
      const entry = group.table?.find((row: any) => row.team?.tla === teamCode || row.team?.id === externalId);
      if (entry) {
        standing = entry;
        groupName = group.group || "";
        break;
      }
    }

    // 2. All finished WC matches for this team
    const matchesData = await httpsGet(`${BASE_URL}/competitions/WC/matches?status=FINISHED`);
    const teamMatches = (matchesData.matches || []).filter((m: any) =>
      m.homeTeam?.id === externalId || m.awayTeam?.id === externalId
    );

    const recentResults = teamMatches.slice(-5).reverse().map((m: any) => {
      const isHome = m.homeTeam?.id === externalId;
      const opponent = isHome ? m.awayTeam?.tla : m.homeTeam?.tla;
      const opponentName = isHome ? m.awayTeam?.name : m.homeTeam?.name;
      const myGoals = isHome ? m.score?.fullTime?.home : m.score?.fullTime?.away;
      const theirGoals = isHome ? m.score?.fullTime?.away : m.score?.fullTime?.home;
      let result: "W" | "D" | "L" = "D";
      if (myGoals !== null && theirGoals !== null) {
        if (myGoals > theirGoals) result = "W";
        else if (myGoals < theirGoals) result = "L";
      }
      return { opponent, opponentName, myGoals, theirGoals, result, date: m.utcDate };
    });

    return { standing, groupName, recentResults };
  },
  ["wc-standings-results"],
  { revalidate: 3600 } // 1 hour
);

// ── ROUTE HANDLER ──────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamCode: string }> }
) {
  const { teamCode: rawCode } = await params;
  const teamCode = rawCode.toUpperCase();

  // Validate team code exists in our mappings
  if (!FIFA_TEAM_MAPPINGS[teamCode]) {
    return NextResponse.json({ error: "Unknown team code" }, { status: 404 });
  }

  const supabase = createServiceClient();

  // ── Step 1: Check DB for static data ────────────────────────────────────────
  let { data: profile } = await supabase
    .from("team_profiles")
    .select("*")
    .eq("team_code", teamCode)
    .maybeSingle();

  // ── Step 2: If not in DB, seed from external API ────────────────────────────
  if (!profile) {
    const teamsData = await httpsGet(`${BASE_URL}/competitions/WC/teams`);
    const teams: any[] = teamsData.teams || [];

    // find by TLA or name match
    const fullNames = FIFA_TEAM_MAPPINGS[teamCode];
    const apiTeam = teams.find((t: any) =>
      t.tla === teamCode || fullNames.some(n => t.name === n || t.shortName === n)
    );

    if (!apiTeam) {
      return NextResponse.json({ error: "Team not found in WC API" }, { status: 404 });
    }

    const players = selectTopPlayers(apiTeam.squad || []);

    const newProfile = {
      team_code: teamCode,
      full_name: apiTeam.name,
      external_id: apiTeam.id,
      coach_name: apiTeam.coach ? `${apiTeam.coach.firstName || ""} ${apiTeam.coach.lastName || ""}`.trim() : null,
      coach_nationality: apiTeam.coach?.nationality || null,
      founded: apiTeam.founded || null,
      club_colors: apiTeam.clubColors || null,
      crest_url: apiTeam.crest || null,
      players,
      last_synced_at: new Date().toISOString(),
    };

    const { data: inserted } = await supabase
      .from("team_profiles")
      .upsert(newProfile, { onConflict: "team_code" })
      .select("*")
      .single();

    profile = inserted || newProfile;
  }

  // ── Step 3: Get live standings + recent results (cached 1h) ─────────────────
  const liveData = await getStandingsAndResults(teamCode, profile.external_id);

  return NextResponse.json({
    teamCode,
    fullName: profile.full_name,
    coachName: profile.coach_name,
    coachNationality: profile.coach_nationality,
    founded: profile.founded,
    clubColors: profile.club_colors,
    crestUrl: profile.crest_url,
    players: profile.players || [],
    standing: liveData.standing ? {
      group: liveData.groupName,
      position: liveData.standing.position,
      points: liveData.standing.points,
      played: liveData.standing.playedGames,
      won: liveData.standing.won,
      draw: liveData.standing.draw,
      lost: liveData.standing.lost,
      goalsFor: liveData.standing.goalsFor,
      goalsAgainst: liveData.standing.goalsAgainst,
    } : null,
    recentResults: liveData.recentResults,
  });
}
