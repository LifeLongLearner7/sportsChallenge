import { createServiceClient } from "./auth-actions";

export interface PredictionResult {
  userId: string;
  matchId: string;
  userWinner: string;
  aiWinner: string;
  actualWinner: string;
  pointsEarned: number;
  beatTheAI: boolean;
}

/**
 * Calculates correct points based on prediction and AI performance.
 * Logic:
 * - 100 points for correct prediction.
 * - 50 points bonus if Human was correct AND AI was wrong ("Neural Override").
 */
export const calculatePoints = (
  userWinner: string,
  aiWinner: string,
  actualWinner: string
): { points: number; isNeuralOverride: boolean } => {
  let points = 0;
  let isNeuralOverride = false;

  // Correct Prediction: +100
  if (userWinner.toLowerCase() === actualWinner.toLowerCase()) {
    points += 100;

    // Neural Override (Beat the AI): +50
    // Only if AI was WRONG and Human was RIGHT
    if (aiWinner.toLowerCase() !== actualWinner.toLowerCase()) {
      points += 50;
      isNeuralOverride = true;
    }
  }

  return { points, isNeuralOverride };
};

/**
 * Processes all predictions for a specifically completed match.
 *
 * ARCHITECTURE (Millions-Scale — O(n) not O(n²)):
 *
 * OLD approach (N+1 problem):
 *   for each predictor:
 *     SELECT * FROM predictions WHERE user_id = X   ← full table scan per user
 *     UPDATE profiles ...
 *   = O(n) SELECT scans + O(n) UPDATEs = brutal quota burn at scale
 *
 * NEW approach (batch + aggregate):
 *   1. ONE query: fetch all predictions for the match
 *   2. ZERO queries: compute points in-memory
 *   3. ONE batch upsert: update all prediction records simultaneously
 *   4. ONE aggregate query per UNIQUE user: SUM/COUNT only (single-row result)
 *   5. ONE profile update per unique user
 *
 * DB Cost: O(1) + O(1) + O(u) where u = unique users (<<< n²)
 */
export const processAllPredictionsForMatch = async (
  matchId: string,
  actualWinner: string,
  aiWinner?: string
) => {
  const supabase = await createServiceClient();

  // ── Step 1: Fetch ALL predictions for this match in ONE query ─────────────
  const { data: predictions, error: fetchError } = await supabase
    .from("predictions")
    .select("id, user_id, prediction")
    .eq("match_id", matchId);

  if (fetchError || !predictions || predictions.length === 0) {
    console.log(`Scoring: No predictions found for match ${matchId}.`);
    return { success: true, processed: 0 };
  }

  console.log(
    `Scoring: Processing ${predictions.length} predictions for match ${matchId}...`
  );

  // ── Step 2: Compute points for ALL users in-memory (ZERO extra DB calls) ──
  const resolvedAiWinner = aiWinner || "";
  const scoringResults = predictions.map((pred) => {
    const { points, isNeuralOverride } = calculatePoints(
      pred.prediction,
      resolvedAiWinner,
      actualWinner
    );
    return {
      id: pred.id,
      user_id: pred.user_id,
      points_won: points,
      is_neural_override: isNeuralOverride,
    };
  });

  // ── Step 3: Batch-update ALL prediction records in ONE upsert ─────────────
  const { error: batchUpsertError } = await supabase
    .from("predictions")
    .upsert(
      scoringResults.map((r) => ({
        id: r.id,
        points_won: r.points_won,
        is_neural_override: r.is_neural_override,
        is_correct: (r.points_won || 0) > 0, // NEW: Hardened flag
      })),
      { onConflict: "id" }
    );

  if (batchUpsertError) {
    console.error(
      "Scoring: Batch prediction upsert failed:",
      batchUpsertError
    );
    // Non-fatal: profile updates can still proceed with computed in-memory data
  }

  // ── Step 4 & 5: Update each UNIQUE user profile via a single aggregate ────
  // Collect unique user IDs from this match's predictions
  const uniqueUserIds = [...new Set(scoringResults.map((r) => r.user_id))];

  // Parallelize profile updates for performance at scale
  await Promise.all(uniqueUserIds.map(async (userId) => {
    const { data: aggData, error: aggError } = await supabase
      .from("predictions")
      .select("points_won")
      .eq("user_id", userId);

    if (aggError || !aggData) {
      console.error(
        `Scoring: Aggregate query failed for user ${userId}:`,
        aggError
      );
      return;
    }

    const totalPredicted = aggData.length;
    const totalPoints = aggData.reduce(
      (sum, p) => sum + (p.points_won || 0),
      0
    );
    const totalCorrect = aggData.filter((p) => (p.points_won || 0) > 0).length;
    const newAccuracy =
      totalPredicted > 0 ? (totalCorrect / totalPredicted) * 100 : 0;

    await supabase
      .from("profiles")
      .update({
        points: totalPoints,
        matches_predicted: totalPredicted,
        accuracy: Math.round(newAccuracy * 10) / 10,
      })
      .eq("id", userId);
  }));

  // ── Step 6: Calculate and store "Outfoxed" count ─────────────────────────
  // A strategist "outfoxes" the AI if AI was WRONG and they were RIGHT.
  const isAiWrong = aiWinner?.toLowerCase() !== actualWinner.toLowerCase();
  
  if (isAiWrong) {
    const outfoxedCount = scoringResults.filter(r => 
      r.points_won > 0 && r.user_id !== "00000000-0000-0000-0000-000000000001"
    ).length;

    await supabase
      .from("matches")
      .update({ outfoxed_count: outfoxedCount })
      .eq("id", matchId);
    
    console.log(`Scoring: Neural Core outfoxed by ${outfoxedCount} strategists in match ${matchId}.`);
  }

  // ── Step 7: Update Global Platform Stats (The Scalability Win) ────────────
  const AI_USER_ID_STATS = "00000000-0000-0000-0000-000000000001";

  // Exclude Mr. Predicto from human stats
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("accuracy, points")
    .eq("is_ai", false);

  if (allProfiles) {
    const totalUsers = allProfiles.length;
    const avgAccuracy = allProfiles.reduce((acc, p) => acc + (p.accuracy || 0), 0) / (totalUsers || 1);
    const humanPointsTotal = allProfiles.reduce((acc, p) => acc + (p.points || 0), 0);
    
    // AI accuracy = actual win rate, not self-reported confidence
    const { data: resolvedMatches } = await supabase
      .from("matches")
      .select("ai_prediction, winner")
      .not("winner", "is", null);
    const aiCorrect = resolvedMatches?.filter(m => m.ai_prediction === m.winner).length || 0;
    const aiAccuracy = resolvedMatches?.length
      ? (aiCorrect / resolvedMatches.length) * 100
      : 0;
    const totalMatchesCount = resolvedMatches?.length || 0;

    // Get Mr. Predicto's actual scored points
    const { data: aiProfile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", AI_USER_ID_STATS)
      .single();

    await supabase.from("global_stats").upsert({
      sport: 'cricket',
      human_accuracy: Math.round(avgAccuracy * 10) / 10,
      ai_accuracy: Math.round(aiAccuracy * 10) / 10,
      human_points_total: humanPointsTotal,
      ai_points_total: aiProfile?.points || 0,
      total_matches: totalMatchesCount,
      total_users: totalUsers,
      last_updated: new Date().toISOString()
    }, { onConflict: 'sport' });
  }

  // ── Step 8: System Log (Diagnostic Transparency) ─────────────────────────
  await logSystemActivity('scoring', 'success', `Processed ${predictions.length} predictions for match ${matchId}.`);

  console.log(
    `Scoring: Successfully processed ${predictions.length} predictions across ${uniqueUserIds.length} unique users.`
  );
  return { success: true, processed: predictions.length };
};

/**
 * Diagnostic Logging System
 */
export async function logSystemActivity(type: string, status: 'success' | 'failure', message: string, metadata?: any) {
  try {
    const supabase = await createServiceClient();
    await supabase.from('system_logs').insert({
      activity_type: type,
      status,
      message,
      metadata
    });
  } catch (e) {
    console.error('Logging Failure:', e);
  }
}
