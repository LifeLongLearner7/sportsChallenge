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
      
      const matchDateStr = new Date(match.match_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const venueStr = match.venue && match.venue !== "TBD" ? match.venue : "";
      
      // Strict parameterization to force the search engine to hone in on the exact fixture
      const query = `IPL 2026 ${match.team_a} vs ${match.team_b} ${venueStr} ${matchDateStr} 
      Provide structured pre-match data for IPL 2026 match: [${match.team_a} vs ${match.team_b}] on ${matchDateStr} at ${venueStr}.
      Return in this format:
      Pitch at ${venueStr}:
      - type:
      - avg_score:
      - chasing_advantage:

      Venue (${venueStr}) Stats:
      - last_matches_summary:
      - batting_first_win_percent:
      - chasing_win_percent:

      Team Form:
      - ${match.team_a}_last5:
      - ${match.team_b}_last5:
      - head_to_head:

      Key Players:
      - key_batsmen:
      - key_bowlers:

      Probable XI:
      - ${match.team_a}:
      - ${match.team_b}:

      Toss:
      - preferred_decision:
      - impact:

      Weather at  ${venueStr} on ${matchDateStr}:
      - condition:
      - dew_factor:
      - rain_probability:

      Only include factual, recent, data-backed insights for IPL 2026 ${match.team_a} vs ${match.team_b} at  ${venueStr} on ${matchDateStr}
      `;
      
      console.log(`Strategic Pulse: Initiating LIVE RECON via Tavily for ${match.team_a} vs ${match.team_b}...`);
      
      const searchResponse = await tvly.search(query, {
        searchDepth: "basic",
        maxResults: 3,
        topic: "news",
        include_answer: true,
        days: 14 // Only pull articles from the last 14 days
      });
      
      if (searchResponse.results && searchResponse.results.length > 0) {
        liveContext = searchResponse.results.map((r: any) => r.content).join("\n\n");
      }
    } catch (searchError) {
      console.error("TAVILY RECON FAILURE:", searchError);
    }
  }

  const prompt = `
    You are 'SPORTS-AI-CORE', a high-fidelity sports analysis AI designed for the IPL season. Expert at analyses based on team players, pitch and immediate performance. 
    Task: Predict the winning likelihood and provide strategic reasoning for the following T20 fixture. 
    
    Match Information:
    Teams: ${match.team_a} vs ${match.team_b}
    Venue: ${match.venue || "TBD"}
    Date: ${new Date(match.match_time).toLocaleDateString()}
    
    LIVE INTEL (RECENT SEARCH RESULTS):
    ${liveContext}

    Format output Requirements:
    - winner: Must be exactly ${match.team_a} or ${match.team_b}
    - confidence: An integer between 50 and 99
    - reasoning: A technical, data-driven strategic insight incorporating the live intel (Exactly 130-150 characters)
    - match_intel: A heavily structured synthesis of the LIVE INTEL formatted exactly like this:
        "Pitch Report: ...\nHead-to-Head: ...\nPreferred_decision on TOSS: ...\nTactical Edge: ..."
        (If exact data isn't in the intel, make a strong analytical assumption to fill the gaps. Do not mention outdated years like 2024 or 2025).
    
    Return ONLY a raw JSON object. No markdown, no prose.
    Example: {"winner": "RCB", "confidence": 78, "reasoning": "RCB's middle order stability on high scoring Bengaluru surfaces gives them a 14% higher operational efficiency than SRH's current pace attack.", "match_intel": "Pitch Report: Flat track, high scoring...\nHead-to-Head: RCB leads 14-10...\nPreferred_decision on TOSS: Batting first...\nTactical Edge: Spin vs pace at death"}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    // Ensure fallback if match_intel wasn't generated
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
         if (winner === "team_a" || winner === teamA) {
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
 * Combined Sync (for manual administration)
 */
export async function systemAutomatedSync() {
  await systemStatusSync(); // 01:00 AM Logic
  await systemResultSync(); // 02:00 AM Logic
  await systemPredictionSync(); // 03:00 AM Logic
  return { success: true, mode: "full_sync" };
}


