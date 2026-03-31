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


export interface Profile {
  id: string;
  screen_name?: string;
  avatar_url?: string;
  avatar_id?: string;
  is_admin?: boolean;
  is_ai?: boolean;
  points?: number;
  matches_predicted: number;
  accuracy: number;
}

