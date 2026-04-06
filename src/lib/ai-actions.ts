"use server";

import OpenAI from "openai";
import { createServiceClient } from "./auth-actions";
import { Match } from "@/types";
import { revalidatePath } from "next/cache";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { fetchRecentResults, determineWinner, fetchMatchInfo, TEAM_MAPPINGS } from "./api-service";
import { processAllPredictionsForMatch, logSystemActivity } from "./scoring";

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


/**
 * Generate a specialized strategic prediction for a match using OpenAI
 */
export async function generateMatchPrediction(match: Match) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("AI ANALYSIS OFFLINE: OpenAI API Key missing from encrypted environment.");
    return null;
  }

  const prompt = `
    You are 'SPORTS-AI-CORE', a high-fidelity sports analysis AI designed for the IPL 2026 season.Expert at analyses based on team players, pitch and immediate performance. 
    Task: Predict the winning likelihood and provide strategic reasoning for the following T20 fixture. 
    
    Match Information:
    Teams: ${match.team_a} vs ${match.team_b}
    Venue: ${match.venue || "TBD"}
    Date: ${new Date(match.match_time).toLocaleDateString()}
    
    Format Requirements:
    - winner: Must be exactly ${match.team_a} or ${match.team_b}
    - confidence: An integer between 50 and 99
    - reasoning: A technical, data-driven strategic insight (Exactly 130-150 characters)
    
    Return ONLY a raw JSON object. No markdown, no prose.
    Example: {"winner": "RCB", "confidence": 78, "reasoning": "RCB's middle order stability on high scoring Bengaluru surfaces gives them a 14% higher operational efficiency than SRH's current pace attack."}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
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
    let resolutionSource: "MAPPING_ID" | "NEURAL" | "API" | null = null;

    // 🛡️ SUB-PULSE A: SURGICAL ID MAPPING (Tournament-Centric)
    const { data: linkage } = await supabase
      .from("external_fixtures")
      .select("external_id")
      .eq("match_id", match.id)
      .single();

    if (linkage?.external_id) {
      console.log(`Surgical Scan: Match ${match.id} linked to External ID ${linkage.external_id}. Probing Match Info...`);
      const extMatch = await fetchMatchInfo(linkage.external_id);
      
      if (extMatch) {
         const winnerKey = determineWinner(extMatch, match.team_a, match.team_b);
         if (winnerKey) {
            actualWinnerName = winnerKey === "team_a" ? match.team_a : match.team_b;
            resolutionSource = "MAPPING_ID";
         }
      }
    }

    // 🛡️ SUB-PULSE B: NEURAL EMERGENCY (OpenAI Search) - Only if mapping fails
    if (!actualWinnerName) {
      try {
        const neuralResult = await verifyWinnerWithNeuralResearch(match);
        if (neuralResult && neuralResult.winner_name && neuralResult.winner_name !== "Draw") {
          actualWinnerName = neuralResult.winner_name;
          resolutionSource = "NEURAL";
        }
      } catch (e) {
        process.stdout.write(`Neural Pulse Bypass for ${match.id}\r`);
      }
    }

    // 🛡️ SUB-PULSE C: API DEEP FALLBACK (Original firehose logic)
    if (!actualWinnerName) {
      try {
        if (!externalResults) externalResults = await fetchRecentResults();
        
        const fallbackMatch = externalResults.find(em => {
            const teamNames = (em.teams || []).map((t: string) => t.toLowerCase());
            const aliasesA = [match.team_a, ...(TEAM_MAPPINGS[match.team_a] || [])].map(a => a.toLowerCase());
            const aliasesB = [match.team_b, ...(TEAM_MAPPINGS[match.team_b] || [])].map(b => b.toLowerCase());
            return teamNames.some((t: string) => aliasesA.some(a => t.includes(a) || a.includes(t))) && 
                   teamNames.some((t: string) => aliasesB.some(b => t.includes(b) || b.includes(t)));
        });

        if (fallbackMatch) {
           const winnerKey = determineWinner(fallbackMatch, match.team_a, match.team_b);
           if (winnerKey) {
              actualWinnerName = winnerKey === "team_a" ? match.team_a : match.team_b;
              resolutionSource = "API";
           }
        }
      } catch (e) {
        console.error("API Backup Failure:", e);
      }
    }

    // 🛡️ FINALIZATION
    if (actualWinnerName) {
      await processAllPredictionsForMatch(match.id, actualWinnerName, match.ai_prediction);
      await supabase.from("matches").update({ winner: actualWinnerName, status: "completed" }).eq("id", match.id);
      
      const successMsg = `Match resolved via ${resolutionSource}: ${match.team_a} vs ${match.team_b} (${actualWinnerName} won).`;
      await logSystemActivity('result', 'success', successMsg);
      resolvedCount++;
    } else {
      const failMsg = `Sync Failure: No verified winner found (MAPPING/AI/API exhausted) for ${match.team_a} vs ${match.team_b}.`;
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
                ai_reasoning: prediction.reasoning
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


