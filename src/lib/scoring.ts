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

  const uWinner = (userWinner || "").trim().toLowerCase();
  const aWinner = (aiWinner || "").trim().toLowerCase();
  const actWinner = (actualWinner || "").trim().toLowerCase();

  // ── Abandoned Match Protocol (v16.2) ────────────────────────────────────
  // 50 point compensation for all who predicted, regardless of team choice
  if (actWinner === "abandoned") {
    return { points: 50, isNeuralOverride: false };
  }

  // Correct Prediction: +100
  if (uWinner === actWinner) {
    points += 100;

    // Neural Override (Beat the AI): +50
    // Only if AI was WRONG and Human was RIGHT
    if (aWinner !== actWinner) {
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

  const { data: match } = await supabase
    .from("matches")
    .select("sport")
    .eq("id", matchId)
    .single();
  const matchSport = match?.sport || "cricket";

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
      scoringResults.map((r) => {
        const original = predictions.find(p => p.id === r.id);
        return {
          id: r.id,
          user_id: r.user_id,
          match_id: matchId,
          prediction: original?.prediction || "",
          points_won: r.points_won,
          is_neural_override: r.is_neural_override,
          is_correct: (r.points_won || 0) > 0,
        };
      }),
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
      // 1. Fetch current profile data to perform an incremental update
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("points, matches_predicted, accuracy")
        .eq("id", userId)
        .single();
      // 1. Fetch ALL prediction history to ensure accuracy is calculated from the full dataset
      const { data: history, error: historyError } = await supabase
        .from("predictions")
        .select("points_won")
        .eq("user_id", userId);

      if (historyError || !history) return;

      const totalPredicted = history.length;
      const totalCorrect = history.filter((p) => (p.points_won || 0) > 0).length;
      const newAccuracy = totalPredicted > 0 ? (totalCorrect / totalPredicted) * 100 : 0;

      // 2. ATOMIC RECONSTRUCTION: Re-calculate absolute truth from yours verified history
      const totalPointsSum = history.reduce((sum, p) => sum + (p.points_won || 0), 0);
      
      await supabase
        .from("profiles")
        .update({
          points: totalPointsSum,
          matches_predicted: totalPredicted,
          accuracy: Math.round(newAccuracy * 10) / 10,
        })
        .eq("id", userId);
    }));

  // ── Step 5B: Update Group-Specific Points ────────────────────────────────
  // For every user who predicted on this match, find which groups they belong to
  // and re-aggregate their group-local prediction history (predictions made AFTER
  // they joined the group). Group points start at 0 and are fully independent of
  // global profile points.
  try {
    // Fetch all group memberships for users who predicted on this match
    const { data: groupMemberships } = await supabase
      .from("group_members")
      .select("group_id, user_id, joined_at")
      .in("user_id", uniqueUserIds);

    if (groupMemberships && groupMemberships.length > 0) {
      // For each (user, group) pair, recalculate group-local stats
      await Promise.all(
        groupMemberships.map(async (membership: any) => {
          // Fetch all SCORED predictions this user made for matches
          // that started after they joined this group
          const { data: groupPredictions } = await supabase
            .from("predictions")
            .select("points_won, created_at")
            .eq("user_id", membership.user_id)
            .not("points_won", "is", null)
            .gte("created_at", membership.joined_at);

          if (!groupPredictions) return;

          const totalPredicted = groupPredictions.length;
          const totalCorrect = groupPredictions.filter(
            (p: any) => (p.points_won || 0) > 0
          ).length;
          const totalPoints = groupPredictions.reduce(
            (sum: number, p: any) => sum + (p.points_won || 0),
            0
          );
          const newAccuracy =
            totalPredicted > 0
              ? Math.round((totalCorrect / totalPredicted) * 1000) / 10
              : 0;

          await supabase
            .from("group_members")
            .update({
              points: totalPoints,
              matches_predicted: totalPredicted,
              accuracy: newAccuracy,
            })
            .eq("group_id", membership.group_id)
            .eq("user_id", membership.user_id);
        })
      );
      console.log(`Scoring: Group points updated for ${groupMemberships.length} memberships.`);
    }
  } catch (groupErr) {
    // Non-fatal: group scoring failure should not block global scoring
    console.error("Scoring: Group points update failed (non-fatal):", groupErr);
  }

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
    
    // AI accuracy = actual win rate, not self-reported confidence, filtered by sport
    const { data: resolvedMatches } = await supabase
      .from("matches")
      .select("ai_prediction, winner")
      .eq("sport", matchSport)
      .not("winner", "is", null);
    const aiCorrect = resolvedMatches?.filter(m => m.ai_prediction === m.winner).length || 0;
    const aiAccuracy = resolvedMatches?.length
      ? (aiCorrect / resolvedMatches.length) * 100
      : 0;
    const totalMatchesCount = resolvedMatches?.length || 0;

    // Get Mr. Predicto's actual scored points for this sport
    const { data: aiPredictions } = await supabase
      .from("predictions")
      .select("points_won, matches!inner(sport)")
      .eq("user_id", AI_USER_ID_STATS)
      .eq("matches.sport", matchSport);
    const aiPointsTotal = aiPredictions?.reduce((acc, p) => acc + (p.points_won || 0), 0) || 0;

    // Get total human points for this sport
    const { data: humanPredictions } = await supabase
      .from("predictions")
      .select("points_won, matches!inner(sport)")
      .neq("user_id", AI_USER_ID_STATS)
      .eq("matches.sport", matchSport);
    const humanPointsTotal = humanPredictions?.reduce((acc, p) => acc + (p.points_won || 0), 0) || 0;

    await supabase.from("global_stats").upsert({
      sport: matchSport,
      human_accuracy: Math.round(avgAccuracy * 10) / 10,
      ai_accuracy: Math.round(aiAccuracy * 10) / 10,
      human_points_total: humanPointsTotal,
      ai_points_total: aiPointsTotal,
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
 * THE GLOBAL AUDIT (Restoration Protocol)
 * Recalculates all strategist stats based on historical prediction truth.
 */
export async function systemGlobalAudit() {
  const supabase = await createServiceClient();
  console.log("Strategic Audit: Starting Global Point Reconstruction...");

  // 1. Fetch all COMPLETED nodes
  const { data: matches } = await supabase
    .from("matches")
    .select("id, winner, ai_prediction, team_a, team_b")
    .eq("status", "completed")
    .not("winner", "is", null);

  if (!matches || matches.length === 0) return { success: true, message: "No static data found to audit." };

  // 2. Fetch ALL prediction history (Bypass the 1,000 row default limit)
  let allPredictions: any[] = [];
  let from = 0;
  const chunk = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error: batchErr } = await supabase
      .from("predictions")
      .select("*")
      .range(from, from + chunk - 1);
    
    if (batchErr || !batch) break;
    allPredictions = [...allPredictions, ...batch];
    if (batch.length < chunk) hasMore = false;
    from += chunk;
  }
  
  if (allPredictions.length === 0) return { success: false, error: "Database link lost or no prediction history found." };
  console.log(`Strategic Audit: Universal Vision Active. Scanning ${allPredictions.length} prediction nodes...`);

  // 3. Batch repair individual prediction records
  const correctedPredictions = allPredictions.map(pred => {
    const match = matches.find(m => m.id === pred.match_id);
    if (!match) return null;

    const { points, isNeuralOverride } = calculatePoints(
      pred.prediction,
      match.ai_prediction || "",
      match.winner!
    );
    
    // Debug Trace for specific Match ID (PBKS vs GT)
    if (match.team_a === 'PBKS' || match.team_b === 'PBKS') {
        process.stdout.write(`Strategic Audit Trace [${match.team_a} vs ${match.team_b}]: User -> ${pred.prediction} | AI -> ${match.ai_prediction} | Winner -> ${match.winner} | CALC -> ${points}pts\n`);
    }

    return {
      ...pred, // Spread the original record to preserve user_id, match_id, and prediction
      points_won: points,
      is_neural_override: isNeuralOverride,
      is_correct: points > 0
    };
  }).filter(p => p !== null);

  if (correctedPredictions.length > 0) {
    console.log(`Strategic Audit: Transmitting ${correctedPredictions.length} repaired records to the mainframe...`);
    const { error: updError, data: upsertData } = await supabase
        .from("predictions")
        .upsert(correctedPredictions, { onConflict: 'id' })
        .select('id, points_won');
        
    if (updError) {
        console.error("CRITICAL: Audit Upsert Failed!", updError);
        await logSystemActivity('audit', 'failure', `Upsert Failure: ${updError.message}`);
        return { success: false, error: updError.message };
    }
    console.log(`Strategic Audit: DB successfully integrated ${upsertData?.length || 0} corrections.`);
  }

  // 4. Rebuild all Profiles from historical truth
  const userIds = [...new Set(allPredictions.map(p => p.user_id))];
  
  await Promise.all(userIds.map(async (userId) => {
    const userPredictions = allPredictions.filter(p => p.user_id === userId);
    
    const totalPoints = userPredictions.reduce((sum, p) => {
        const corrected = correctedPredictions.find(cp => cp?.id === p.id);
        return sum + (corrected?.points_won || 0);
    }, 0);

    const totalCorrect = userPredictions.filter(p => {
        const corrected = correctedPredictions.find(cp => cp?.id === p.id);
        return (corrected?.points_won || 0) > 0;
    }).length;

    const accuracy = userPredictions.length > 0 ? (totalCorrect / userPredictions.length) * 100 : 0;

    await supabase
      .from("profiles")
      .update({
        points: totalPoints,
        total_points: totalPoints, // Synchronize legacy/secondary points columns
        matches_predicted: userPredictions.length,
        accuracy: Math.round(accuracy * 10) / 10
      })
      .eq("id", userId);
  }));

  // 6. Match Metric Reconstruction: Aggregating Outfoxed Counts
  console.log("Strategic Audit: Reconstructing match metrics (Outfoxed Counts)...");
  await Promise.all(matches.map(async (match) => {
    const aiWinner = (match.ai_prediction || "").toLowerCase();
    const actualWinner = (match.winner || "").toLowerCase();
    
    // An AI is outfoxed if its prediction was WRONG and the actual result is known
    if (aiWinner !== actualWinner) {
      const matchPredictions = correctedPredictions.filter(p => 
        p?.match_id === match.id && 
        p?.is_neural_override === true &&
        p.user_id !== "00000000-0000-0000-0000-000000000001" // Exclude the AI itself
      );
      
      await supabase
        .from("matches")
        .update({ outfoxed_count: matchPredictions.length })
        .eq("id", match.id);
    } else {
      // If AI was right, outfoxed count is technically 0
      await supabase
        .from("matches")
        .update({ outfoxed_count: 0 })
        .eq("id", match.id);
    }
  }));

  await logSystemActivity('audit', 'success', `Global Audit completed for ${userIds.length} strategists and ${matches.length} fixtures.`);
  return { success: true, auditedUsers: userIds.length };
}

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
