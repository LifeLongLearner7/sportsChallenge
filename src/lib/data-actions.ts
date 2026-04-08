"use server";

import { createClient } from "./auth-actions";
import { Match, Prediction, Profile } from "@/types";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
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

export const triggerCachePurge = async () => {
  await requireAdmin();
  
  // 1. Clear Data Cache Tags (Back-end)
  const tags = [
    "all-matches",
    "platform-stats",
    "total-strategists",
    "user-detailed-history",
    "landing-stats",
    "leaderboard-list",
    "user-rank",
    "completed-matches",
    "arena-messages"
  ];
  
  // Use explicit revalidation with the 'max' argument to satisfy environment protocols
  tags.forEach(tag => revalidateTag(tag, 'max'));

  // 2. Clear Page Cache Paths (Front-end)
  const paths = ["/", "/dashboard", "/leaderboard", "/arena", "/admin/matches", "/profile"];
  paths.forEach(path => {
    revalidatePath(path, 'page');
    revalidatePath(path, 'layout');
  });
  
  return { success: true, pathsCleared: paths.length, tagsCleared: tags.length };
};

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
  { revalidate: 1800, tags: ["all-matches"] }
);

/**
 * CACHED PROFILE FETCHER (Phase 4.2.1)
 * Decoupled from the dynamic 'cookies' scope to satisfy unstable_cache requirements.
 */
const fetchProfileFromDb = unstable_cache(
  async (userId: string, email?: string) => {
    const { data: profile } = await staticSupabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile) {
      return {
        id: userId,
        screen_name: email?.split("@")[0] || "New Strategist",
        points: 0,
        matches_predicted: 0,
        accuracy: 0,
        is_admin: false,
      } as Profile;
    }

    return profile as Profile;
  },
  ["user-profile-session"],
  { revalidate: 1800, tags: ["user-profile-session"] }
);

/**
 * DYNAMIC IDENTITY WRAPPER
 * Retrieves the user identity via cookies and passes it to the cached fetcher.
 */
export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;
  
  // Pass stable ID and fallback email to the cached data layer
  return await fetchProfileFromDb(user.id, user.email);
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
  { revalidate: 1800, tags: ["platform-stats"] }
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
  { revalidate: 1800, tags: ["total-strategists"] }
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
  { revalidate: 1800, tags: ["user-detailed-history"] }
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

  // SECURITY FORTIFICATION (V-01): Strict Whitelist
  // Explicitly pick ONLY user-editable fields.
  // Prevent modification of 'is_admin', 'points', 'onboarding_completed', etc.
  const sanitizedUpdates = {
    screen_name: updates.screen_name,
    full_name: updates.full_name,
    avatar_url: updates.avatar_url,
  };

  // Remove undefined fields to avoid overwriting existing data with NULL
  Object.keys(sanitizedUpdates).forEach(
    key => sanitizedUpdates[key as keyof typeof sanitizedUpdates] === undefined && delete sanitizedUpdates[key as keyof typeof sanitizedUpdates]
  );

  const { error } = await supabase
    .from("profiles")
    .update(sanitizedUpdates)
    .eq("id", user.id);

  if (error) throw error;

  revalidatePath("/profile/settings");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}



export const getLandingStats = unstable_cache(
  async () => {
    // 🔥 PARALLELIZED HIGH-VELOCITY FETCH
    const [statsResult, topUserResult] = await Promise.all([
      staticSupabase.from("global_stats").select("*").eq("sport", "cricket").maybeSingle(),
      staticSupabase.from("profiles").select("screen_name, accuracy").eq("is_ai", false).order("points", { ascending: false }).limit(1).maybeSingle()
    ]);

    const stats = statsResult.data;
    const topUser = topUserResult.data;

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
  { revalidate: 1800 }
);


/**
 * DECOUPLED TOP PREDICTOR FETCH (Phase 4.2 Streaming)
 * Separated from landing stats so it can be streamed independently
 */
export const getTopPredictor = unstable_cache(
  async () => {
    const { data: topUser } = await staticSupabase
      .from("profiles")
      .select("screen_name, accuracy")
      .eq("is_ai", false)
      .order("points", { ascending: false })
      .limit(1)
      .maybeSingle();

    return topUser || { screen_name: "STRIKER_X", accuracy: 89.4 };
  },
  ["top-predictor-solo"],
  { revalidate: 1800 }
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
  { revalidate: 1800 } 
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
  { revalidate: 1800 }
);

export async function getArenaStats() {
  const stats = await getGlobalStats();
  return stats;
}

// Tactical Comm-Link (Discussion) Actions
export async function manualPurgeMessages() {
  await requireAdmin();
  const { createServiceClient } = await import("./auth-actions");
  const supabase = await createServiceClient();
  
  const expiry = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { error, count } = await supabase
    .from("arena_messages")
    .delete({ count: 'exact' })
    .lt("created_at", expiry);

  if (error) throw error;
  
  revalidateTag("arena-messages", 'max');
  revalidatePath("/arena", 'layout');
  
  return { success: true, purgedCount: count || 0 };
}

export const getArenaMessages = unstable_cache(
  async () => {
    // Fresh Feed Fetch
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
  { revalidate: 1800 } // Real-time client subscription handles fresh messages seamlessly
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

export async function triggerGlobalAudit() {
  await requireAdmin();
  const { systemGlobalAudit } = await import("./scoring");
  revalidatePath("/leaderboard");
}

export async function resolveMatchAbandoned(matchId: string) {
  await requireAdmin();
  const supabase = await createClient();
  
  // 1. Get Match Data
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("ai_prediction, team_a, team_b")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) throw new Error("Match not found");

  // 2. Update Match to Abandoned Status
  const { error: updateError } = await supabase
    .from("matches")
    .update({ 
      winner: "abandoned", 
      status: "completed"
    })
    .eq("id", matchId);

  if (updateError) throw updateError;

  // 3. Process Scoring with 'abandoned' winner (Grants 50 points to all)
  const { processAllPredictionsForMatch } = await import("./scoring");
  await processAllPredictionsForMatch(matchId, "abandoned", match.ai_prediction);

  revalidatePath("/dashboard");
  revalidatePath("/arena");
  revalidatePath("/leaderboard");
  revalidatePath("/admin/matches");
  
  return { success: true };
}

export async function triggerTournamentRegistrySync() {
  await requireAdmin();
  const { syncTournamentRegistry } = await import("./ai-actions");
  return await syncTournamentRegistry();
}

/**
 * IDENTITY COLLISION AUDIT (v8.1)
 * Scans internal matches against official fixtures to identify double-headers.
 */
export async function runCollisionAudit() {
  await requireAdmin();
  const { fetchSeriesInfo, TEAM_MAPPINGS } = await import("./api-service");
  
  // 1. Fetch Official Library
  const SERIES_ID = "87c62aac-bc3c-4738-ab93-19da0690488f";
  const externalMatches = await fetchSeriesInfo(SERIES_ID);
  if (!externalMatches) throw new Error("API Connection Failure.");

  // 2. Fetch Internal Nodes
  const { data: internalMatches } = await staticSupabase
    .from("matches")
    .select("id, team_a, team_b, match_time, winner")
    .order("match_time", { ascending: true });

  // 3. Identification Loop
  const report = {
    unlinked: [] as any[],
    conflicts: [] as any[],
    mapped: 0
  };

  const externalMap = new Map();
  externalMatches.forEach(em => {
    const teams = (em.teams || []).map(t => t.toLowerCase()).sort().join('_vs_');
    if (!externalMap.has(teams)) externalMap.set(teams, []);
    externalMap.get(teams).push(em);
  });

  // Check which internal matches have mappings
  const { data: currentLinks } = await staticSupabase.from("external_fixtures").select("match_id, external_id");
  const linkedMap = new Set(currentLinks?.map(l => l.match_id) || []);

  internalMatches?.forEach(im => {
    if (linkedMap.has(im.id)) {
      report.mapped++;
      return;
    }

    const iTeams = [im.team_a.toLowerCase(), im.team_b.toLowerCase()].sort().join('_vs_');
    const candidates = externalMap.get(iTeams) || [];

    if (candidates.length > 1) {
      report.conflicts.push({
        id: im.id,
        summary: `${im.team_a} vs ${im.team_b}`,
        internalDate: im.match_time,
        candidates: candidates.map((c: any) => ({ id: c.id, date: c.date, name: c.name }))
      });
    } else if (candidates.length === 0) {
      report.unlinked.push({ id: im.id, summary: `${im.team_a} vs ${im.team_b} (No API Match Found)` });
    }
  });

  return report;
}

export async function linkMatchSurgically(matchId: string, externalId: string) {
  await requireAdmin();
  const { createServiceClient } = await import("./auth-actions");
  const supabase = await createServiceClient();

  const { error } = await supabase.from("external_fixtures").upsert({
    match_id: matchId,
    external_id: externalId,
    series_id: "87c62aac-bc3c-4738-ab93-19da0690488f"
  }, { onConflict: "external_id" });

  if (error) throw error;
  
  revalidatePath("/admin/matches");
  return { success: true };
}

export const getUserBraggingStats = unstable_cache(
  async (userId: string) => {
    // Fetch predictions with match status to ensure we only count resolved matches
    const { data: predictions, error } = await staticSupabase
      .from("predictions")
      .select("points_won, is_neural_override, created_at, matches ( status )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !predictions) {
      return { currentStreak: 0, aiBeatenCount: 0 };
    }

    // Filter to only resolved matches
    const resolvedPredictions = predictions.filter((p: any) => p.matches?.status === "completed");

    let currentStreak = 0;
    for (const p of resolvedPredictions) {
      if ((p.points_won || 0) > 0) {
        currentStreak++;
      } else {
        break; // Streak broken on the first loss
      }
    }

    const aiBeatenCount = resolvedPredictions.filter((p: any) => p.is_neural_override).length;

    return { currentStreak, aiBeatenCount };
  },
  ["user-bragging-stats"],
  { revalidate: 1800, tags: ["user-bragging-stats"] }
);

