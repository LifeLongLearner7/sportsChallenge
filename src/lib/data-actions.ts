"use server";

import { createClient } from "./auth-actions";
import { Match, Prediction, Profile } from "@/types";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) throw new Error("Forbidden: Admin privileges required");
  return user;
}

export async function getMatches() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("match_time", { ascending: true });

  if (error) throw error;
  return data as Match[];
}

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Return a basic profile object if the record is missing
    return {
      id: user.id,
      screen_name: user.email?.split("@")[0] || "New Strategist",
      points: 0,
      matches_predicted: 0,
      accuracy: 0,
      is_admin: false,
      rank: 999
    } as Profile & { rank: number };
  }

  // Calculate Rank
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: 'exact', head: true })
    .gt("points", profile.points || 0);

  return { ...profile, rank: (count || 0) + 1 } as Profile & { rank: number };
}

export async function getLeaderboardStats() {
  const supabase = await createClient();
  
  // 1. Total Nodes (Strategists)
  const { count: activeNodes } = await supabase
    .from("profiles")
    .select("*", { count: 'exact', head: true });

  // 2. Mean Accuracy
  const { data: accuracyData } = await supabase
    .from("profiles")
    .select("accuracy");

  const avgAccuracy = accuracyData?.length 
    ? accuracyData.reduce((acc, p) => acc + (p.accuracy || 0), 0) / accuracyData.length 
    : 0;

  // 3. Human Dominance (Vs 50% baseline)
  const dominance = avgAccuracy - 50;

  return {
    activeNodes: activeNodes?.toLocaleString() || "0",
    meanAccuracy: (Math.round(avgAccuracy * 10) / 10).toFixed(1) + "%",
    dominance: (dominance > 0 ? "+" : "") + (Math.round(dominance * 10) / 10).toFixed(1) + "%"
  };
}

export async function getUserPredictions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);

  if (error) return [];
  return data as Prediction[];
}

export async function submitPrediction(matchId: string, predictedWinner: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("predictions")
    .upsert({
      user_id: user.id,
      match_id: matchId,
      prediction: predictedWinner,
    }, { onConflict: "user_id,match_id" });

  if (error) throw error;

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProfile(updates: Partial<Profile>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) throw error;

  revalidatePath("/profile/settings");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getGlobalStats() {
  const supabase = await createClient();
  
  // 1. Total User Count
  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: 'exact', head: true });

  // 2. Average Human Accuracy
  const { data: humanAccData } = await supabase
    .from("profiles")
    .select("accuracy");
  
  // 3. Average AI Core Accuracy (from matches)
  const { data: aiAccData } = await supabase
    .from("matches")
    .select("ai_confidence");

  const avgHumanAccuracy = humanAccData?.length 
    ? humanAccData.reduce((acc, p) => acc + (p.accuracy || 0), 0) / humanAccData.length 
    : 0;

  const avgAiAccuracy = aiAccData?.length 
    ? aiAccData.reduce((acc, m) => acc + (m.ai_confidence || 0), 0) / aiAccData.length 
    : 72.5; // Baseline if no AI matches

  return {
    userCount: userCount || 0,
    avgHumanAccuracy: Math.round(avgHumanAccuracy * 10) / 10,
    avgAiAccuracy: Math.round(avgAiAccuracy * 10) / 10,
  };
}

export async function getLandingStats() {
  const supabase = await createClient();
  
  // 1. Total Human Points (Collective Status)
  const { data: humanPointsData } = await supabase
    .from("profiles")
    .select("points");
  
  const totalHumanPoints = humanPointsData?.reduce((acc, p) => acc + (p.points || 0), 0) || 0;

  // 2. AI Core Integrity (Total Confidence from all resolved matches)
  const { data: aiConfidenceData } = await supabase
    .from("matches")
    .select("ai_confidence")
    .not("winner", "is", null);

  const totalAiPoints = aiConfidenceData?.reduce((acc, m) => acc + (m.ai_confidence || 0), 0) || 0;

  // 3. Global Accuracy (Average across all strategists)
  const { data: globalAccuracyData } = await supabase
    .from("profiles")
    .select("accuracy");

  const avgAccuracy = globalAccuracyData?.length 
    ? globalAccuracyData.reduce((acc, p) => acc + (p.accuracy || 0), 0) / globalAccuracyData.length 
    : 0;

  // 4. Top Predictor (Real-time Leaderboard)
  const { data: topUser } = await supabase
    .from("profiles")
    .select("screen_name, accuracy")
    .order("points", { ascending: false })
    .limit(1)
    .single();

  return {
    humanScore: totalHumanPoints.toLocaleString(),
    aiScore: totalAiPoints.toLocaleString(),
    globalAccuracy: (Math.round(avgAccuracy * 10) / 10).toFixed(1),
    topPredictor: topUser || { screen_name: "STRIKER_X", accuracy: 89.4 }
  };
}


export async function getLeaderboard(limit = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("points", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data as Profile[];
}

// Arena Data Actions
export async function getCompletedMatches() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "completed")
    .order("match_time", { ascending: false });

  if (error) throw error;
  return data as Match[];
}

export async function getArenaStats() {
  const stats = await getGlobalStats();
  return stats;
}

// Tactical Comm-Link (Discussion) Actions
export async function getArenaMessages() {
  const supabase = await createClient();
  
  // 1. Automatic 24-hour Purge
  const internalExp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("arena_messages")
    .delete()
    .lt("created_at", internalExp);

  // 2. Fetch Fresh Feed
  const { data, error } = await supabase
    .from("arena_messages")
    .select(`
      *,
      profiles (screen_name, avatar_url)
    `)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return [];
  return data;
}

export async function sendArenaMessage(content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("arena_messages")
    .insert({
      user_id: user.id,
      content,
    });

  if (error) throw error;
  
  revalidatePath("/arena");
  return { success: true };
}

export async function deleteArenaMessage(messageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  
  // Check message ownership
  const { data: message } = await supabase.from("arena_messages").select("user_id").eq("id", messageId).single();
  
  if (!message) throw new Error("Message not found");
  
  if (message.user_id !== user.id && !profile?.is_admin) {
    throw new Error("Forbidden: You can only delete your own messages");
  }

  const { error } = await supabase
    .from("arena_messages")
    .delete()
    .eq("id", messageId);

  if (error) throw error;
  
  revalidatePath("/arena");
  return { success: true };
}

export async function getAdminAnalytics() {
  const supabase = await createClient();
  const now = new Date();
  
  // 1. Prediction Volume (Last 7 Days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: volData } = await supabase
    .from("predictions")
    .select("created_at")
    .gte("created_at", sevenDaysAgo);

  const dailyVolume = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toDateString();
    const count = volData?.filter(p => new Date(p.created_at).toDateString() === d).length || 0;
    return { date: d.split(" ").slice(1, 3).join(" "), count };
  });

  // 2. Today's Sentiment Breakdown
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  
  const { data: todayMatch } = await supabase
    .from("matches")
    .select("id, team_a, team_b")
    .gte("match_time", todayStart)
    .lte("match_time", todayEnd)
    .single();

  let sentiment = { teamA: 50, teamB: 50, teamAName: "Team A", teamBName: "Team B", total: 0 };

  if (todayMatch) {
    const { data: predData } = await supabase
      .from("predictions")
      .select("prediction")
      .eq("match_id", todayMatch.id);
    
    if (predData && predData.length > 0) {
      const teamACount = predData.filter(p => p.prediction === 'team_a' || p.prediction === todayMatch.team_a).length;
      const teamBCount = predData.length - teamACount;
      sentiment = {
        teamA: Math.round((teamACount / predData.length) * 100),
        teamB: Math.round((teamBCount / predData.length) * 100),
        teamAName: todayMatch.team_a,
        teamBName: todayMatch.team_b,
        total: predData.length
      };
    } else {
      sentiment = {
        ...sentiment,
        teamAName: todayMatch.team_a,
        teamBName: todayMatch.team_b
      };
    }
  }

  return { dailyVolume, sentiment };
}

export async function updateMatchWinner(matchId: string, winnerKey: "team_a" | "team_b") {
  await requireAdmin();
  const supabase = await createClient();
  
  // 1. Get Match Data (to get ai_prediction and actual team names)
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("ai_prediction, team_a, team_b")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) throw new Error("Match not found");

  // Resolve actual name (e.g., 'RCB' instead of 'team_a')
  const actualWinnerName = winnerKey === "team_a" ? match.team_a : match.team_b;

  // 2. Update Match
  const { error: updateError } = await supabase
    .from("matches")
    .update({ 
      winner: actualWinnerName, 
      status: "completed"
    })

    .eq("id", matchId);

  if (updateError) throw updateError;

  // 3. Process Scoring with the actual team name
  const { processAllPredictionsForMatch } = await import("./scoring");
  await processAllPredictionsForMatch(matchId, actualWinnerName, match.ai_prediction);


  revalidatePath("/dashboard");
  revalidatePath("/arena");
  revalidatePath("/leaderboard");
  revalidatePath("/admin/matches");
  
  return { success: true };
}

export async function triggerManualSync() {
  await requireAdmin();
  const { systemAutomatedSync } = await import("./ai-actions");
  const result = await systemAutomatedSync();
  return result;
}

