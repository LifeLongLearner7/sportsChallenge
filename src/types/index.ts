export interface Match {
  id: string;
  team_a: string;
  team_b: string;
  team_a_logo?: string;
  team_b_logo?: string;
  match_time: string;
  venue?: string;
  status: "upcoming" | "live" | "completed" | "active";
  sport?: string;
  tournament?: string;
  ai_prediction?: string;
  ai_confidence?: number;
  ai_reasoning?: string;
  match_intel?: string;
  winner?: string;
  outfoxed_count?: number;
  updated_at?: string;
}


export interface GlobalStats {
  id: string;
  sport: string;
  human_accuracy: number;
  ai_accuracy: number;
  human_points_total: number;
  ai_points_total: number;
  total_matches: number;
  total_users: number;
  last_updated: string;
}


export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  prediction: string;
  is_correct?: boolean;
  points_won?: number;
  is_neural_override?: boolean;
  created_at: string;
}


export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  description?: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

/**
 * A group member row merged with their group-specific scoring stats.
 * Points/accuracy here are group-local (start at 0 on join), NOT global profile points.
 */
export interface GroupMemberWithProfile {
  user_id: string;
  group_id: string;
  joined_at: string;
  points: number;
  matches_predicted: number;
  accuracy: number;
  role: "creator" | "admin" | "member";
  // Merged from profiles table
  screen_name?: string;
  avatar_url?: string;
  is_ai?: boolean;
}

export interface Profile {
  id: string;
  screen_name?: string;
  full_name?: string;
  avatar_url?: string;
  avatar_id?: string;
  is_admin?: boolean;
  is_ai?: boolean;
  points?: number;
  matches_predicted: number;
  accuracy: number;
  onboarding_completed?: boolean;
}

