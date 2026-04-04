"use server";

import OpenAI from "openai";
import { createServiceClient } from "./auth-actions";
import { Match } from "@/types";
import { revalidatePath } from "next/cache";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { fetchRecentResults, determineWinner, TEAM_MAPPINGS } from "./api-service";
import { processAllPredictionsForMatch, logSystemActivity } from "./scoring";


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
 */
export async function systemResultSync() {
  const supabase = await createServiceClient();
  const now = new Date();

  console.log(`Strategic Pulse: Initiating Match Result Sync at ${now.toISOString()}...`);

  // 1. Resolve Passed Matches via External API
  const { data: pastMatches } = await supabase
    .from("matches")
    .select("*")
    .lt("match_time", now.toISOString())
    .neq("status", "completed");

  if (pastMatches && pastMatches.length > 0) {
    console.log(`Strategic Pulse: Processing ${pastMatches.length} pending matches.`);

    
    const externalResults = await fetchRecentResults();
    
    for (const match of pastMatches) {
       // A. Try to find the match in external results using aliases
       const externalMatch = externalResults.find(em => {
          const teamNames = em.teams.map(t => t.toLowerCase());
          const matchA = match.team_a.toLowerCase();
          const matchB = match.team_b.toLowerCase();
          
          const aliasesA = [matchA, ...(TEAM_MAPPINGS[match.team_a] || [])].map(a => a.toLowerCase());
          const aliasesB = [matchB, ...(TEAM_MAPPINGS[match.team_b] || [])].map(b => b.toLowerCase());

          const hasA = teamNames.some(t => aliasesA.some(a => t.includes(a) || a.includes(t)));
          const hasB = teamNames.some(t => aliasesB.some(b => t.includes(b) || b.includes(t)));
          
          return hasA && hasB;
       });

       let actualWinnerKey: "team_a" | "team_b" | null = null;

       if (externalMatch) {
         actualWinnerKey = determineWinner(externalMatch, match.team_a, match.team_b);
       }

        if (actualWinnerKey) {
          const actualWinnerName = actualWinnerKey === "team_a" ? match.team_a : match.team_b;
          console.log(`Strategic Pulse: Match ${match.id} resolved as ${actualWinnerName}. Awarding points...`);
          
          // CRITICAL: Process points FIRST. If this fails, match status remains pending for retry.
          await processAllPredictionsForMatch(match.id, actualWinnerName, match.ai_prediction);

          // Update status only AFTER scoring success
          await supabase
            .from("matches")
            .update({ winner: actualWinnerName, status: "completed" })
            .eq("id", match.id);

          console.log(`Strategic Pulse: Match ${match.id} finalized successfully.`);
        }
    }
  }

  await logSystemActivity('result', 'success', `Match result sync completed at ${now.toLocaleTimeString()}`);

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  return { success: true, mode: "results_synced" };
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


