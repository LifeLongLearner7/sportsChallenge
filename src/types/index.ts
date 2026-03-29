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
}


export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  prediction: string;
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
  points?: number;
  total_points?: number;
  matches_predicted: number;
  accuracy: number;
}

