"use server";

import OpenAI from "openai";
import { createClient } from "./auth-actions";
import { Match } from "@/types";
import { revalidatePath } from "next/cache";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { fetchRecentResults, determineWinner, TEAM_MAPPINGS } from "./api-service";
import { processAllPredictionsForMatch } from "./scoring";


/**
 * Generate a specialized strategic prediction for a match using OpenAI
 */
export async function generateMatchPrediction(match: Match) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("AI ANALYSIS OFFLINE: OpenAI API Key missing from encrypted environment.");
    return null;
  }

  const prompt = `
    You are 'ANTIGRAVITY-CORE', a high-fidelity sports analysis AI designed for the IPL 2026 season.
    Task: Predict the winning likelihood and provide strategic reasoning for the following T20 fixture.
    
    Match Information:
    Teams: ${match.team_a} vs ${match.team_b}
    Venue: ${match.venue || "TBD"}
    Date: ${new Date(match.match_time).toLocaleDateString()}
    
    Format Requirements:
    - winner: Must be exactly "team_a" or "team_b"
    - confidence: An integer between 50 and 99
    - reasoning: A technical, data-driven strategic insight (Exactly 130-150 characters)
    
    Return ONLY a raw JSON object. No markdown, no prose.
    Example: {"winner": "team_a", "confidence": 78, "reasoning": "RCB's middle order stability on high scoring Bengaluru surfaces gives them a 14% higher operational efficiency than SRH's current pace attack."}
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
 * THE RESULT PULSE (02:00 AM IST)
 * Synchronizes real match results and processes player scoring.
 */
export async function systemResultSync() {
  const supabase = await createClient();
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

       let actualWinner: "team_a" | "team_b" | null = null;


       if (externalMatch) {
         actualWinner = determineWinner(externalMatch, match.team_a, match.team_b);
       }

       if (actualWinner) {
         console.log(`Strategic Pulse: Match ${match.id} resolved as ${actualWinner}.`);
         
         await supabase
           .from("matches")
           .update({ winner: actualWinner, status: "completed" })
           .eq("id", match.id);

         await processAllPredictionsForMatch(match.id, actualWinner, match.ai_prediction);
       }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  return { success: true, mode: "results_synced" };
}

/**
 * THE PREDICTION PULSE (03:00 AM IST)
 * Generates AI tactical insights for tomorrow's fixtures.
 */
export async function systemPredictionSync() {
  const supabase = await createClient();
  const now = new Date();

  console.log(`Strategic Pulse: Initiating AI Tactical Prediction Sync...`);

  const { data: upcomingWithoutPredictions } = await supabase
    .from("matches")
    .select("*")
    .gte("match_time", now.toISOString())
    .is("ai_prediction", null)
    .limit(5); // Process in small batches if needed

  if (upcomingWithoutPredictions && upcomingWithoutPredictions.length > 0) {
    for (const match of upcomingWithoutPredictions) {
       const prediction = await generateMatchPrediction(match);
       if (prediction) {
         await supabase
           .from("matches")
           .update({
             ai_prediction: prediction.winner,
             ai_confidence: prediction.confidence,
             ai_reasoning: prediction.reasoning
           })
           .eq("id", match.id);
       }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/arena");
  return { success: true, mode: "predictions_synced" };
}

/**
 * Combined Sync (for manual administration)
 */
export async function systemAutomatedSync() {
  await systemResultSync();
  await systemPredictionSync();
  return { success: true, mode: "full_sync" };
}


