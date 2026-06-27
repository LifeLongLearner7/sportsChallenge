"use server";

import OpenAI from "openai";
import { createServiceClient } from "./auth-actions";
import { Match } from "@/types";
import { revalidatePath } from "next/cache";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { 
  fetchRecentResults, 
  determineWinner, 
  fetchMatchInfo, 
  fetchSeriesInfo, 
  TEAM_MAPPINGS 
} from "./api-service";
import {
  fetchAllFifaFixtures,
  fetchFifaFixtureById,
  fetchRecentFifaResults,
  determineFifaWinner,
  FIFA_TEAM_MAPPINGS,
  FIFA_LEAGUE_ID,
  FIFA_SEASON,
} from "./football-api-service";
import { processAllPredictionsForMatch, logSystemActivity } from "./scoring";

/**
 * THE REGISTRY PULSE (v6.8)
 * Populates the external_fixtures table with all 70 matches from the series.
 * Performs a greedy alignment to link your 64 prediction nodes to their official IDs.
 */
export async function syncTournamentRegistry(seriesId: string = "87c62aac-bc3c-4738-ab93-19da0690488f") {
  const supabase = await createServiceClient();
  console.log(`Strategic Pulse: Resynchronizing Tournament Registry for Series ${seriesId}...`);

  try {
    // 🛡️ STEP 0: Nuclear Reset (Clean Slate for this Series)
    // Wipe all existing fixture data and mappings for this series to prevent identity ghosting
    const { error: deleteError } = await supabase
      .from("external_fixtures")
      .delete()
      .eq("series_id", seriesId);

    if (deleteError) {
      console.error("Strategic Reset Failure:", deleteError);
      throw new Error("Could not clear existing registry data.");
    }

    // 🛡️ STEP 1: Library Re-Population (Fetching all 70 Matches)
    const externalMatches = await fetchSeriesInfo(seriesId);
    if (!externalMatches) throw new Error("Could not retrieve fixture list from Series ID.");

    for (const em of externalMatches) {
       await supabase.from("external_fixtures").insert({
          external_id: em.id,
          series_id: seriesId,
          name: em.name,
          date: em.date,
          status: em.status
       });
    }

    // 🛡️ STEP 2: Identity Alignment Pulse (Mapping our internal nodes)
    const { data: internalMatches } = await supabase.from("matches").select("id, team_a, team_b, match_time").order("match_time", { ascending: true });
    if (!internalMatches) return { success: false, reason: "No internal matches found." };

    let linkedCount = 0;
    const usedExternalIds = new Set<string>();

    for (const match of internalMatches) {
      // Find matching external fixture (Greedy Multi-Pass)
      const potentialMatches = externalMatches
        .filter(em => {
          const emTeams = (em.teams || []).map(t => t.toLowerCase());
          const aliasesA = [match.team_a, ...(TEAM_MAPPINGS[match.team_a] || [])].map(a => a.toLowerCase());
          const aliasesB = [match.team_b, ...(TEAM_MAPPINGS[match.team_b] || [])].map(b => b.toLowerCase());
          return emTeams.some(t => aliasesA.some(a => t.includes(a) || a.includes(t))) && 
                 emTeams.some(t => aliasesB.some(b => t.includes(b) || b.includes(t)));
        })
        .filter(em => !usedExternalIds.has(em.id));

      if (potentialMatches.length > 0) {
        // High-Fidelity Pick: Prefer the closest date
        let bestMatch = potentialMatches[0];
        let minDiff = Infinity;
        
        for (const pm of potentialMatches) {
           const diff = Math.abs(new Date(match.match_time).getTime() - new Date(pm.date).getTime());
           if (diff < minDiff) { 
              minDiff = diff; 
              bestMatch = pm; 
           }
        }

        await supabase.from("external_fixtures").update({ match_id: match.id }).eq("external_id", bestMatch.id);
        usedExternalIds.add(bestMatch.id);
        linkedCount++;
      }
    }

    await logSystemActivity('sync', 'success', `Tournament Registry Synchronized: ${linkedCount} matches surgically linked.`);
    revalidatePath("/admin/matches");
    return { success: true, count: linkedCount };
  } catch (error: any) {
    console.error("Registry Sync Failure:", error);
    return { success: false, error: error.message };
  }
}

/**
 * FIFA REGISTRY SYNC (v1.0)
 * Links internal football matches to their official API-Football fixture IDs.
 * Uses a clean-slate approach per tournament to prevent identity ghosting.
 */
export async function syncFifaRegistry() {
  const supabase = await createServiceClient();
  const FIFA_SERIES_KEY = `fifa_wc_${FIFA_SEASON}`;
  console.log(`FIFA Sync: Resynchronizing FIFA World Cup ${FIFA_SEASON} Registry...`);

  try {
    // Step 1: Fetch all fixtures from API-Football
    let externalFixtures = await fetchAllFifaFixtures();
    if (!externalFixtures || externalFixtures.length === 0) {
      throw new Error("No API fixtures returned from football-data.org. Registry sync aborted.");
    }

    // Step 2: Safely Upsert all external fixtures into the registry
    // This updates the dates and names without wiping existing match_id mappings
    for (const ef of externalFixtures) {
      await supabase.from("external_fixtures").upsert({
        external_id: String(ef.fixture.id),
        series_id: FIFA_SERIES_KEY,
        name: `${ef.teams.home.name} vs ${ef.teams.away.name}`,
        date: ef.fixture.date,
        status: ef.fixture.status.long,
      }, { onConflict: 'external_id' });
    }

    // Step 3: Fetch all internal football matches
    const { data: internalMatches } = await supabase
      .from("matches")
      .select("id, team_a, team_b, match_time")
      .eq("sport", "football")
      .eq("tournament", "fifa_wc_2026")
      .order("match_time", { ascending: true });

    if (!internalMatches) return { success: false, reason: "No internal football matches found." };

    // Fetch existing mappings to avoid re-linking or stealing links
    const { data: linkedFixtures } = await supabase
      .from("external_fixtures")
      .select("match_id, external_id")
      .eq("series_id", FIFA_SERIES_KEY)
      .not("match_id", "is", null);

    const linkedMatchIds = new Set(linkedFixtures?.map(f => f.match_id) || []);
    const linkedExternalIds = new Set(linkedFixtures?.map(f => f.external_id) || []);

    const unlinkedInternal = internalMatches.filter(m => !linkedMatchIds.has(m.id));
    
    let linkedCount = 0;
    const usedExternalIds = new Set<string>(linkedExternalIds);

    // Step 4: Greedy identity alignment (ONLY for unmapped matches)
    for (const match of unlinkedInternal) {
      const aliasesA = [match.team_a, ...(FIFA_TEAM_MAPPINGS[match.team_a] || [])].map((a) => a.toLowerCase());
      const aliasesB = [match.team_b, ...(FIFA_TEAM_MAPPINGS[match.team_b] || [])].map((b) => b.toLowerCase());

      const potentialMatches = externalFixtures.filter((ef) => {
        if (usedExternalIds.has(String(ef.fixture.id))) return false;
        const homeName = ef.teams.home.name.toLowerCase();
        const awayName = ef.teams.away.name.toLowerCase();
        const homeMatch = aliasesA.some((a) => homeName.includes(a) || a.includes(homeName)) ||
                          aliasesB.some((b) => homeName.includes(b) || b.includes(homeName));
        const awayMatch = aliasesA.some((a) => awayName.includes(a) || a.includes(awayName)) ||
                          aliasesB.some((b) => awayName.includes(b) || b.includes(awayName));
        return homeMatch && awayMatch;
      });

      if (potentialMatches.length > 0) {
        // Pick closest by date
        let best = potentialMatches[0];
        let minDiff = Infinity;
        for (const pm of potentialMatches) {
          const diff = Math.abs(new Date(match.match_time).getTime() - new Date(pm.fixture.date).getTime());
          if (diff < minDiff) { minDiff = diff; best = pm; }
        }
        await supabase.from("external_fixtures")
          .update({ match_id: match.id })
          .eq("external_id", String(best.fixture.id));
        usedExternalIds.add(String(best.fixture.id));
        linkedCount++;
      }
    }

    await logSystemActivity('sync', 'success', `FIFA Registry Synchronized: ${linkedCount} matches linked.`);
    revalidatePath("/admin/matches");
    return { success: true, count: linkedCount };
  } catch (error: any) {
    console.error("FIFA Registry Sync Failure:", error);
    return { success: false, error: error.message };
  }
}

/**
 * NEURAL PRIMARY: Identifies the winner of a match using OpenAI's research pulse.
 * This is the high-fidelity failover for when traditional sports APIs rotate data.
 */
export async function verifyWinnerWithNeuralResearch(match: Match) {
  if (!process.env.OPENAI_API_KEY) return null;

  const prompt = `
    You are 'SPORTS-RESULT-CORE'. Identify the official winning team for this past match.
    
    Match Information:
    Tournament: ${match.tournament || "IPL 2026"}
    Teams: ${match.team_a} vs ${match.team_b}
    Date: ${new Date(match.match_time).toLocaleDateString()}
    Venue: ${match.venue || "TBD"}
    
    Task: Resolve the final fixture outcome.
    Return ONLY a raw JSON object with these fields:
    - winner_name: The exact name of the winning team (must be ${match.team_a} or ${match.team_b}). Return "Draw" if the match was a tie/no result.
    - status_string: A short summary (e.g., "LSG won by 33 runs").
    - confidence: Integer (80-100).
    
    Example: {"winner_name": "LSG", "status_string": "Lucknow Super Giants won by 33 runs", "confidence": 100}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3, // Low temperature for factual accuracy
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    if (result.confidence >= 95 && result.winner_name) {
       return result;
    }
    return null;
  } catch (err) {
    console.error("NEURAL RESEARCH FAILURE:", err);
    return null;
  }
}


import { tavily } from "@tavily/core";

/**
 * Generate a specialized strategic prediction for a match using OpenAI + Tavily RAG
 */
export async function generateMatchPrediction(match: Match) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("AI ANALYSIS OFFLINE: OpenAI API Key missing from encrypted environment.");
    return null;
  }

  let liveContext = "No live news available.";
  
  if (process.env.TAVILY_API_KEY) {
    try {
      const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
      const isFootball = match.sport === "football";

      const query = isFootball
        ? `${match.team_a} vs ${match.team_b} FIFA World Cup 2026 preview form injuries head to head`
        : `IPL 2026 ${match.team_a} vs ${match.team_b} ${match.venue || ""} preview pitch report key players news`;

      console.log(`Strategic Pulse: LIVE RECON via Tavily for ${match.team_a} vs ${match.team_b}...`);

      const searchResponse = await tvly.search(query, {
        searchDepth: "basic",
        maxResults: 3,
        topic: "news",
        days: 14,
      });

      if (searchResponse.results && searchResponse.results.length > 0) {
        liveContext = searchResponse.results.map((r: any) => r.content).join("\n\n");
      }
    } catch (searchError) {
      console.error("TAVILY RECON FAILURE:", searchError);
    }
  }

  const isFootball = match.sport === "football";

  const prompt = isFootball ? `
    You are 'SPORTS-AI-CORE', a high-fidelity football analysis AI for FIFA World Cup ${new Date(match.match_time).getFullYear()}.
    Task: Predict the most likely outcome for the following match.

    Match: ${match.team_a} vs ${match.team_b}
    Stage: ${(match as any).round || "Group Stage"}
    Venue: ${match.venue || "TBD"}
    Date: ${new Date(match.match_time).toLocaleDateString()}

    LIVE INTEL:
    ${liveContext}

    Format Requirements:
    - winner: Must be exactly "${match.team_a}", "${match.team_b}", or "draw"
    - confidence: Integer between 50 and 99
    - reasoning: Tactical insight based on form, history, tournament context (130-150 characters)
    - match_intel: Structured synthesis: "Form: ...\\nH2H: ...\\nKey Players: ...\\nTactical Edge: ..."

    Return ONLY raw JSON. No markdown.
    Example: {"winner": "BRA", "confidence": 72, "reasoning": "Brazil's high press dominates in neutral venues; Argentina's midfield lacks depth without Enzo.", "match_intel": "Form: BRA W4D1 L0\\nH2H: BRA leads 10-6\\nKey Players: Vinicius Jr, Lautaro\\nTactical Edge: BRA press vs ARG slow build-up"}
  ` : `
    You are 'SPORTS-AI-CORE', a high-fidelity sports analysis AI for IPL cricket.
    Task: Predict the winning likelihood and provide strategic reasoning for the following T20 fixture.

    Match Information:
    Teams: ${match.team_a} vs ${match.team_b}
    Venue: ${match.venue || "TBD"}
    Date: ${new Date(match.match_time).toLocaleDateString()}

    LIVE INTEL (RECENT SEARCH RESULTS):
    ${liveContext}

    Format Requirements:
    - winner: Must be exactly ${match.team_a} or ${match.team_b}
    - confidence: An integer between 50 and 99
    - reasoning: A technical, data-driven strategic insight incorporating the live intel (Exactly 130-150 characters)
    - match_intel: A structured synthesis: "Pitch Report: ...\\nHead-to-Head: ...\\nPreferred_decision on TOSS: ...\\nTactical Edge: ..."

    Return ONLY a raw JSON object. No markdown, no prose.
    Example: {"winner": "RCB", "confidence": 78, "reasoning": "RCB's middle order stability on high scoring Bengaluru surfaces gives them a 14% higher operational efficiency than SRH's pace attack.", "match_intel": "Pitch Report: Flat track\\nHead-to-Head: RCB leads 14-10\\nPreferred_decision on TOSS: Bat first\\nTactical Edge: Spin vs pace at death"}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    if (!result.match_intel) {
      result.match_intel = liveContext;
    }
    return result;
  } catch (err) {
    console.error("NEURAL LINK FAILURE:", err);
    return null;
  }
}


/**
 * THE STATUS SYNC (01:00 AM IST)
 * Transitions today's matches from 'upcoming' to 'active'.
 */
export async function systemStatusSync() {
  const supabase = await createServiceClient();
  
  // 🛡️ IST Alignment: Explicitly calculate 'Today' in UTC+5:30
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(Date.now() + IST_OFFSET);
  
  const year = nowIST.getUTCFullYear();
  const month = nowIST.getUTCMonth();
  const date = nowIST.getUTCDate();

  // Define the operational 'Today' window in UTC strings for DB comparison
  const startOfDay = new Date(Date.UTC(year, month, date, 0, 0, 0)).toISOString();
  const endOfDay = new Date(Date.UTC(year, month, date, 23, 59, 59)).toISOString();

  console.log(`Strategic Pulse: Activating fixtures for ${year}-${month + 1}-${date} (IST Operational Window)...`);

  const { data: todayMatches, error } = await supabase
    .from("matches")
    .select("id, status, team_a, team_b")
    .eq("status", "upcoming")
    .gte("match_time", startOfDay)
    .lte("match_time", endOfDay);

  if (error) {
    await logSystemActivity('sync', 'failure', 'Daily Status Sync failed', error);
    return { success: false, error };
  }

  if (todayMatches && todayMatches.length > 0) {
    const ids = todayMatches.map(m => m.id);
    const { error: updateError } = await supabase
      .from("matches")
      .update({ status: "active" })
      .in("id", ids);

    if (updateError) {
      console.error("Pulse Failure: Database Constraint Violation?", updateError);
      return { success: false, error: updateError };
    }

    console.log(`Strategic Pulse: Matches marked as ACTIVE: ${todayMatches.map(m => `${m.team_a} vs ${m.team_b}`).join(", ")}`);
    await logSystemActivity('sync', 'success', `Activated ${todayMatches.length} fixtures.`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/arena");
  return { success: true, count: todayMatches?.length || 0 };
}

/**
 * THE RESULT PULSE (02:00 AM IST)
 * Synchronizes real match results and processes player scoring.
 * Strategic Pivot: Prioritizes Surgical ID Mapping (v6.6) over firehose searching.
 */
export async function systemResultSync() {
  const supabase = await createServiceClient();
  
  console.log(`Strategic Pulse: Initiating High-Fidelity Match Result Sync (IPL 2026 Series ID) at ${new Date().toISOString()}...`);

  // 1. Identification: Look for matches that started in the past and are not completed
  const lookupTime = new Date(Date.now() + 2 * 60 * 60 * 1000); 

  const { data: pastMatches } = await supabase
    .from("matches")
    .select("*")
    .lt("match_time", lookupTime.toISOString())
    .neq("status", "completed");

  if (!pastMatches || pastMatches.length === 0) {
    await logSystemActivity('result', 'success', `Match result sync: No pending matches found in resolution window.`);
    return { success: true, mode: "no_pending" };
  }

  console.log(`Strategic Pulse: Processing ${pastMatches.length} pending matches (Surgical ID Mode).`);
  let resolvedCount = 0;
  let externalResults: any[] | null = null; // Lazy load fallback

  for (const match of pastMatches) {
    let actualWinnerName: string | null = null;

    // 🛡️ SUB-PULSE A: SURGICAL ID MAPPING (Tournament-Centric)
    let linkageFound = false;
    let externalId: string | null = null;

    const { data: linkage } = await supabase
      .from("external_fixtures")
      .select("external_id")
      .eq("match_id", match.id)
      .single();

    if (linkage?.external_id) {
      externalId = linkage.external_id;
      linkageFound = true;
    } else {
      // 🕵️ AUTO-HEALING: No Mapping ID Found. Initiate Surgical Registry Repair (v1.1)
      console.log(`Neural Detection: Linkage gap discovered for ${match.team_a} vs ${match.team_b}. Initiating Auto-Repair...`);
      const repairResult = await syncTournamentRegistry();
      
      if (repairResult.success) {
        const { data: repairedLink } = await supabase
          .from("external_fixtures")
          .select("external_id")
          .eq("match_id", match.id)
          .single();
        
        if (repairedLink?.external_id) {
          externalId = repairedLink.external_id;
          linkageFound = true;
          console.log(`Auto-Repair Successful: ID ${externalId} forged for ${match.team_a} vs ${match.team_b}.`);
        }
      }
    }

    if (linkageFound && externalId) {
      console.log(`Surgical Scan: Match ${match.id} linked to External ID ${externalId}. Probing Match Info...`);
      const extMatch = await fetchMatchInfo(externalId);
      
      if (extMatch) {
         const winnerKey = determineWinner(extMatch, match.team_a, match.team_b);
         if (winnerKey) {
            actualWinnerName = winnerKey === "team_a" ? match.team_a : match.team_b;
         }
      }
    }

    // 🛡️ FINALIZATION
    if (actualWinnerName) {
      await processAllPredictionsForMatch(match.id, actualWinnerName, match.ai_prediction);
      await supabase.from("matches").update({ winner: actualWinnerName, status: "completed" }).eq("id", match.id);
      
      const successMsg = `Match resolved via SURGICAL_ID: ${match.team_a} vs ${match.team_b} (${actualWinnerName} won).`;
      await logSystemActivity('result', 'success', successMsg);
      resolvedCount++;
    } else {
      const failMsg = `Sync Failure: No surgical mapping ID found for ${match.team_a} vs ${match.team_b}. Please trigger 'Sync Tournament Registry'.`;
      await logSystemActivity('result', 'failure', failMsg, { matchId: match.id });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  return { success: true, count: resolvedCount };
}

/**
 * THE PREDICTION PULSE (03:00 AM IST)
 * Generates AI tactical insights for tomorrow's fixtures.
 */
export async function systemPredictionSync() {
  const supabase = await createServiceClient();
  const now = new Date();

  console.log(`Strategic Pulse: Initiating AI Tactical Prediction Sync (48H Lookahead)...`);

  const lookaheadWindow = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const { data: upcomingWithoutPredictions } = await supabase
    .from("matches")
    .select("*")
    .gte("match_time", now.toISOString())
    .lte("match_time", lookaheadWindow)
    .is("ai_prediction", null)
    .limit(3); // Process in tight batches

  if (upcomingWithoutPredictions && upcomingWithoutPredictions.length > 0) {
    for (const match of upcomingWithoutPredictions) {
       const prediction = await generateMatchPrediction(match);
       if (prediction?.winner) {
         const winner = prediction.winner.toLowerCase().trim();
         const teamA = match.team_a.toLowerCase().trim();
         const teamB = match.team_b.toLowerCase().trim();

         let actualAiPick = null;
         if (winner === "draw") {
           actualAiPick = "draw";
         } else if (winner === "team_a" || winner === teamA) {
           actualAiPick = match.team_a;
         } else if (winner === "team_b" || winner === teamB) {
           actualAiPick = match.team_b;
         }

          if (actualAiPick) {
            // Update the match with AI prediction
            await supabase
              .from("matches")
              .update({
                ai_prediction: actualAiPick,
                ai_confidence: prediction.confidence,
                ai_reasoning: prediction.reasoning,
                match_intel: prediction.match_intel
              })
              .eq("id", match.id);

            // AUTO-PLAY: Also record this as a prediction for "Mr. Predicto"
            const AI_USER_ID = "00000000-0000-0000-0000-000000000001";
            await supabase
              .from("predictions")
              .upsert({
                user_id: AI_USER_ID,
                match_id: match.id,
                prediction: actualAiPick,
                created_at: new Date().toISOString()
              }, { onConflict: 'user_id,match_id' });
          }
        }
    }
  }

  await logSystemActivity('prediction', 'success', `AI Tactical Sync completed for ${lookaheadWindow}.`);

  revalidatePath("/dashboard");
  revalidatePath("/arena");
  revalidatePath("/leaderboard");
  return { success: true, mode: "predictions_synced" };
}

/**
 * FIFA RESULT SYNC
 * Processes completed FIFA matches and distributes points.
 * Draw predictions ("draw") are worth 100 points.
 */
export async function systemFootballResultSync() {
  const supabase = await createServiceClient();
  const FIFA_SERIES_KEY = `fifa_wc_${FIFA_SEASON}`;
  const now = new Date();
  let resolvedCount = 0;

  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: pastMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("sport", "football")
    .neq("status", "completed")
    .lt("match_time", now.toISOString());

  if (!pastMatches || pastMatches.length === 0) return { success: true, count: 0 };

  for (const match of pastMatches) {
    // Get external fixture ID
    const { data: linkage } = await supabase
      .from("external_fixtures")
      .select("external_id")
      .eq("match_id", match.id)
      .single();

    if (!linkage?.external_id) {
      console.log(`FIFA Result: No linkage for ${match.team_a} vs ${match.team_b}. Triggering auto-repair...`);
      await syncFifaRegistry();
      continue;
    }

    const extId = Number(linkage.external_id);
    let outcome: "team_a" | "team_b" | "draw" | null = null;

    const fixture = await fetchFifaFixtureById(extId);
    if (!fixture) continue;
    outcome = determineFifaWinner(fixture, match.team_a, match.team_b);

    if (!outcome) continue; // Match not finished yet

    // Determine actual winner name for DB storage
    const actualWinnerName = outcome === "draw" ? "draw" : (outcome === "team_a" ? match.team_a : match.team_b);

    // Process all predictions with draw-aware scoring
    await processAllPredictionsForMatch(match.id, actualWinnerName, match.ai_prediction);
    await supabase.from("matches")
      .update({ winner: actualWinnerName, status: "completed" })
      .eq("id", match.id);

    await logSystemActivity('result', 'success', `FIFA: ${match.team_a} vs ${match.team_b} resolved — ${actualWinnerName}.`);
    resolvedCount++;
  }

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  return { success: true, count: resolvedCount };
}

/**
 * Combined Sync (for manual administration)
 */
export async function systemAutomatedSync() {
  await systemStatusSync(); // 01:00 AM Logic
  await systemResultSync(); // 02:00 AM Logic (Cricket)
  await systemFootballResultSync(); // 02:00 AM Logic (Football)
  await systemPredictionSync(); // 03:00 AM Logic
  return { success: true, mode: "full_sync" };
}

/**
 * FIFA MATCH SEEDER (v1.0)
 * Fetches all World Cup 2026 fixtures from API-Football and seeds the 'matches' table.
 */
export async function seedFifaMatches() {
  const supabase = await createServiceClient();
  console.log("FIFA Seeder: Initiating World Cup 2026 fixture seed...");

  try {
    let fixtures = await fetchAllFifaFixtures();
    if (!fixtures || fixtures.length === 0) {
      throw new Error("No API fixtures returned from football-data.org. Seeding aborted.");
    }

    let seededCount = 0;

    const getTeamCode = (name: string): string => {
      const nameLower = name.trim().toLowerCase();
      for (const [code, aliases] of Object.entries(FIFA_TEAM_MAPPINGS)) {
        if (aliases.some(alias => {
          const aliasLower = alias.toLowerCase();
          // If the alias is exactly 3 letters (like GER, AUS), require an exact match.
          // Otherwise, allow exact match or a generous includes (e.g., "United States of America" includes "United States").
          if (aliasLower.length <= 3) {
            return nameLower === aliasLower;
          }
          return nameLower === aliasLower || nameLower.includes(aliasLower) || aliasLower.includes(nameLower);
        })) {
          return code;
        }
      }
      return name.slice(0, 3).toUpperCase();
    };

    for (const f of fixtures) {
      const teamACode = getTeamCode(f.teams.home.name);
      const teamBCode = getTeamCode(f.teams.away.name);
      const matchTime = f.fixture.date;
      const venue = f.fixture.venue.city ? `${f.fixture.venue.name}, ${f.fixture.venue.city}` : f.fixture.venue.name;
      const round = f.league.round;

      const FIFA_SERIES_KEY = `fifa_wc_${FIFA_SEASON}`;

      // Look up existing match using the unique API fixture ID
      const { data: linkage } = await supabase
        .from("external_fixtures")
        .select("match_id")
        .eq("external_id", String(f.fixture.id))
        .maybeSingle();

      let matchId: string;

      if (linkage?.match_id) {
        matchId = linkage.match_id;
        // The match exists, update everything in case it morphed from TBD to resolved teams
        await supabase
          .from("matches")
          .update({
            team_a: teamACode,
            team_b: teamBCode,
            match_time: matchTime,
            venue,
            round,
          })
          .eq("id", matchId);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("matches")
          .insert({
            sport: "football",
            tournament: "fifa_wc_2026",
            team_a: teamACode,
            team_b: teamBCode,
            match_time: matchTime,
            venue,
            round,
            status: "upcoming"
          })
          .select("id")
          .single();

        if (insertError || !inserted) {
          console.error("FIFA Seeder: Failed to insert match:", insertError);
          continue;
        }
        matchId = inserted.id;
        seededCount++;
      }

      await supabase
        .from("external_fixtures")
        .upsert({
          match_id: matchId,
          external_id: String(f.fixture.id),
          series_id: FIFA_SERIES_KEY,
          name: `${f.teams.home.name} vs ${f.teams.away.name}`,
          date: matchTime,
          status: f.fixture.status.long,
        }, { onConflict: "external_id" });
    }

    revalidatePath("/admin/matches");
    revalidatePath("/dashboard");
    revalidatePath("/arena");
    return { success: true, count: seededCount };
  } catch (err: any) {
    console.error("FIFA Seeder Failure:", err);
    return { success: false, error: err.message };
  }
}



