"use server";

import { createClient } from "./auth-actions";
import { Match, Prediction, Profile } from "@/types";
import { revalidatePath, unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const staticSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) throw new Error("Forbidden: Admin privileges required");
  return user;
}

export const getMatches = unstable_cache(
  async () => {
    try {
      const { data, error } = await staticSupabase
        .from("matches")
        .select("*")
        .order("match_time", { ascending: true });

      if (error) {
        console.error("Match Fetch Error:", error);
        return [];
      }
      return (data as Match[]) || [];
    } catch (err) {
      console.error("Match Critical Failure:", err);
      return [];
    }
  },
  ["all-matches"],
  { revalidate: 3600 }
);

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
    } as Profile;
  }

  return profile as Profile;
}


/**
 * UNIFIED PLATFORM STATS (Phase 2.2 — Single Scan)
 * Replaces the two separate getLeaderboardStats + getGlobalStats functions
 * that each independently scanned the profiles table.
 *
 * NOW: One cached function, one DB scan, two derived shape-exports.
 */
export const getPlatformStats = unstable_cache(
  async () => {
    // 🚀 THE SCALING WIN: O(1) Fetch from global_stats table
    try {
      const { data: stats, error } = await staticSupabase
        .from("global_stats")
        .select("*")
        .eq("sport", "cricket")
        .maybeSingle();

      if (error || !stats || stats.total_users === 0) {
        throw new Error(error?.message || "Stats zero or missing");
      }

      const dominance = stats.human_accuracy - 50;

      return {
        userCount: stats.total_users,
        avgHumanAccuracy: stats.human_accuracy,
        avgAiAccuracy: stats.ai_accuracy,
        activeNodes: stats.total_users.toLocaleString(),
        meanAccuracy: stats.human_accuracy.toFixed(1) + "%",
        dominance: (dominance > 0 ? "+" : "") + dominance.toFixed(1) + "%",
      };
    } catch (err) {
      console.warn("Stats Fallback Active:", err);
      
      const { data: profiles } = await staticSupabase.from("profiles").select("accuracy, points");
      const { count: totalCount } = await staticSupabase.from("profiles").select("*", { count: 'exact', head: true });

      const safeProfiles = profiles || [];
      const safeCount = totalCount || 0;
      
      const avgAccuracy = safeProfiles.length
        ? safeProfiles.reduce((acc: number, p: any) => acc + (p.accuracy || 0), 0) / safeProfiles.length
        : 0;
      
      const dominance = avgAccuracy - 50;

      return {
        userCount: safeCount,
        avgHumanAccuracy: Math.round(avgAccuracy * 10) / 10,
        avgAiAccuracy: 72.5,
        activeNodes: safeCount.toLocaleString(),
        meanAccuracy: (Math.round(avgAccuracy * 10) / 10).toFixed(1) + "%",
        dominance: (dominance > 0 ? "+" : "") + (Math.round(dominance * 10) / 10).toFixed(1) + "%",
      };
    }
  },
  ["platform-stats"],
  { revalidate: 3600 }
);

/** Backwards-compatible: Leaderboard page expects this shape */
export const getLeaderboardStats = async () => {
  const stats = await getPlatformStats();
  return {
    activeNodes: stats.activeNodes,
    meanAccuracy: stats.meanAccuracy,
    dominance: stats.dominance,
  };
};

/** Backwards-compatible: Dashboard page expects this shape */
export const getGlobalStats = async () => {
  const stats = await getPlatformStats();
  return {
    userCount: stats.userCount,
    avgHumanAccuracy: stats.avgHumanAccuracy,
    avgAiAccuracy: stats.avgAiAccuracy,
  };
};

export const getTotalStrategists = unstable_cache(
  async () => {
    const { count } = await staticSupabase
      .from("profiles")
      .select("*", { count: 'exact', head: true });
    return count || 0;
  },
  ["total-strategists"],
  { revalidate: 28800 }
);

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

export const getUserDetailedHistory = unstable_cache(
  async (userId: string, limit = 10) => {
    try {
      const { data, error } = await staticSupabase
        .from("predictions")
        .select(`
          *,
          matches (*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Dossier Fetch Error:", error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error("Dossier Critical Failure:", err);
      return [];
    }
  },
  ["user-detailed-history"], 
  { revalidate: 60, tags: ["user-history"] }
);

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



export const getLandingStats = unstable_cache(
  async () => {
    // 🚀 THE SCALING WIN: O(1) Fetch from global_stats table
    const { data: stats } = await staticSupabase
      .from("global_stats")
      .select("*")
      .eq("sport", "cricket")
      .maybeSingle();

    // Still need the top predictor separately as it's a specific record
    const { data: topUser } = await staticSupabase
      .from("profiles")
      .select("screen_name, accuracy")
      .eq("is_ai", false)
      .order("points", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!stats) {
      return {
        humanScore: "0",
        aiScore: "0",
        globalAccuracy: "0.0",
        topPredictor: topUser || { screen_name: "STRIKER_X", accuracy: 89.4 }
      };
    }

    return {
      humanScore: stats.human_points_total.toLocaleString(),
      aiScore: stats.ai_points_total.toLocaleString(),
      globalAccuracy: stats.human_accuracy.toFixed(1),
      topPredictor: topUser || { screen_name: "STRIKER_X", accuracy: 89.4 }
    };
  },
  ["landing-stats"],
  { revalidate: 3600 }
);


export const getLeaderboard = unstable_cache(
  async (limit = 10) => {
    const { data, error } = await staticSupabase
      .from("profiles")
      .select("*")
      .order("points", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Leaderboard Fetch Error:", error);
      return [];
    }
    return (data as Profile[]) || [];
  },
  ["leaderboard-list"],
  { revalidate: 1800 }
);

export const getUserRank = unstable_cache(
  async (userId: string) => {
    const { data: userProfile } = await staticSupabase
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .single();

    if (!userProfile) return 0;

    const { count, error } = await staticSupabase
      .from("profiles")
      .select("*", { count: 'exact', head: true })
      .gt("points", userProfile.points || 0);

    if (error) return 0;
    return (count || 0) + 1;
  },
  ["user-rank"],
  { revalidate: 28800 } // Cache user rank for 8 hours
);

// Arena Data Actions
export const getCompletedMatches = unstable_cache(
  async () => {
    const { data, error } = await staticSupabase
      .from("matches")
      .select("*")
      .eq("status", "completed")
      .order("match_time", { ascending: false });

    if (error) throw error;
    return data as Match[];
  },
  ["completed-matches"],
  { revalidate: 300 }
);

export async function getArenaStats() {
  const stats = await getGlobalStats();
  return stats;
}

// Tactical Comm-Link (Discussion) Actions
const purgeOldMessages = unstable_cache(
  async () => {
    const internalExp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await staticSupabase
      .from("arena_messages")
      .delete()
      .lt("created_at", internalExp);
    return Date.now();
  },
  ["purge-arena-messages"],
  { revalidate: 14400 } // 4 hours
);

export const getArenaMessages = unstable_cache(
  async () => {
    // 1. Automatic 24-hour Purge (Runs once every 6 hours via dedicated cache)
    await purgeOldMessages();

    // 2. Fetch Fresh Feed
    const { data, error } = await staticSupabase
      .from("arena_messages")
      .select(`
        *,
        profiles (screen_name, avatar_url)
      `)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) return [];
    return data;
  },
  ["arena-messages"],
  { revalidate: 60 } // Real-time client subscription handles fresh messages seamlessly
);

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

