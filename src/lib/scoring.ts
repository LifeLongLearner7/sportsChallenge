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

  for (const userId of uniqueUserIds) {
    // ONE single-row aggregate query per user (not a full SELECT *)
    // Returns: total points earned, total predictions made, total correct
    const { data: aggData, error: aggError } = await supabase
      .from("predictions")
      .select("points_won")
      .eq("user_id", userId);

    if (aggError || !aggData) {
      console.error(
        `Scoring: Aggregate query failed for user ${userId}:`,
        aggError
      );
      continue;
    }

    // Compute profile stats deterministically from aggregate result
    const totalPredicted = aggData.length;
    const totalPoints = aggData.reduce(
      (sum, p) => sum + (p.points_won || 0),
      0
    );
    const totalCorrect = aggData.filter((p) => (p.points_won || 0) > 0).length;
    const newAccuracy =
      totalPredicted > 0 ? (totalCorrect / totalPredicted) * 100 : 0;

    // ONE profile update per unique user
    await supabase
      .from("profiles")
      .update({
        points: totalPoints,
        matches_predicted: totalPredicted,
        accuracy: Math.round(newAccuracy * 10) / 10,
      })
      .eq("id", userId);
  }

  console.log(
    `Scoring: Successfully processed ${predictions.length} predictions across ${uniqueUserIds.length} unique users.`
  );
  return { success: true, processed: predictions.length };
};
