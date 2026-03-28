import { MOCK_MATCHES } from "./mock";

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
 * The Strategic Scoring Engine logic.
 * In a real-world scenario, this would interact with the Supabase database.
 * For this MVP, we simulate the calculation process.
 */
export const calculatePoints = (
  userWinner: string, 
  aiWinner: string, 
  actualWinner: string
): { points: number; beatTheAI: boolean } => {
  let points = 0;
  let beatTheAI = false;

  // Base logic: Correct prediction wins points
  if (userWinner === actualWinner) {
    points += 100;
    
    // Strategic "Beat the AI" Bonus
    // If the human predictor was correct AND the AI was wrong
    if (aiWinner !== actualWinner) {
      points += 50;
      beatTheAI = true;
    }
  }

  return { points, beatTheAI };
};

/**
 * Simulates the payout cycle for a completed match.
 */
export const processMatchPayouts = async (matchId: string, actualWinner: string) => {
  const match = MOCK_MATCHES.find(m => m.id === matchId);
  if (!match) return null;

  // Mock prediction processing for a single user (the current player)
  const userPick = "CSK"; // This would come from the user's prediction record in Supabase
  const result = calculatePoints(userPick, match.ai_prediction, actualWinner);

  return {
    matchId,
    actualWinner,
    pointsAwarded: result.points,
    bonusEarned: result.beatTheAI ? "Neural Override Bonus (+50)" : "None",
    status: "Processed Successfully"
  };
};

/**
 * Updates global accuracy stats (Simulated)
 */
export const updateGlobalMetrics = (
  humanWins: number, 
  aiWins: number, 
  totalMatches: number
) => {
  const humanAccuracy = (humanWins / totalMatches) * 100;
  const aiAccuracy = (aiWins / totalMatches) * 100;

  return {
    humanAccuracy: humanAccuracy.toFixed(1),
    aiAccuracy: aiAccuracy.toFixed(1),
    delta: (aiAccuracy - humanAccuracy).toFixed(1)
  };
};
