import { createClient } from "./auth-actions";

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
 * Performs a batch update of both predictions and profile points.
 */
export const processAllPredictionsForMatch = async (matchId: string, actualWinner: string, aiWinner?: string) => {
  const supabase = await createClient();

  // 1. Fetch all predictions for this match
  const { data: predictions, error: fetchError } = await supabase
    .from("predictions")
    .select("user_id, prediction")
    .eq("match_id", matchId);

  if (fetchError || !predictions || predictions.length === 0) {
    console.log(`Scoring: No predictions found for match ${matchId}.`);
    return { success: true, processed: 0 };
  }

  console.log(`Scoring: Processing ${predictions.length} predictions for match ${matchId}...`);

  let processedCount = 0;

  for (const pred of predictions) {
    const { points, isNeuralOverride } = calculatePoints(pred.prediction, aiWinner || "", actualWinner);
    const isCorrect = pred.prediction === actualWinner;

    // A. Update Prediction Record (Use real DB columns)
    await supabase
      .from("predictions")
      .update({
        points_won: points,
        is_neural_override: isNeuralOverride
      })
      .eq("user_id", pred.user_id)
      .eq("match_id", matchId);

      // B. Update User Profile Points (Use real DB columns deterministically for idempotency)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", pred.user_id)
        .single();

      if (profile) {
        // Calculate deterministic stats by aggregating ALL completed predictions
        const { data: allUserPredictions } = await supabase
          .from("predictions")
          .select("points_won, match_id")
          .eq("user_id", pred.user_id);

        let sumPoints = 0;
        let sumPredicted = 0;
        let sumCorrect = 0;

        if (allUserPredictions) {
           sumPredicted = allUserPredictions.length;
           for (const p of allUserPredictions) {
             sumPoints += p.points_won || 0;
             if ((p.points_won || 0) > 0) sumCorrect++;
           }
        }

        const newAccuracy = sumPredicted > 0 
          ? (sumCorrect / sumPredicted) * 100 
          : 0;

        await supabase
          .from("profiles")
          .update({
            points: sumPoints,
            matches_predicted: sumPredicted,
            accuracy: Math.round(newAccuracy * 10) / 10
          })
          .eq("id", pred.user_id);
      }

    
    processedCount++;
  }

  return { success: true, processed: processedCount };
};


