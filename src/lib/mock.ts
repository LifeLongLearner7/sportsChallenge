export interface Match {
  id: string;
  sport_id: string;
  team_a: string;
  team_b: string;
  team_a_logo?: string;
  team_b_logo?: string;
  match_time: string;
  venue?: string;
  status: "upcoming" | "live" | "completed";
  ai_prediction: string;
  ai_confidence: number;
  ai_reasoning: string;
}

export const MOCK_MATCHES: Match[] = [
  {
    id: "1",
    sport_id: "cricket",
    team_a: "CSK",
    team_b: "RCB",
    match_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    venue: "Chepauk, Chennai",
    status: "upcoming",
    ai_prediction: "CSK",
    ai_confidence: 72,
    ai_reasoning: "CSK's spin arsenal is lethal at Chepauk. Expected spin-friendly deck favors Jadeja's control over RCB's explosive top order."
  },
  {
    id: "2",
    sport_id: "cricket",
    team_a: "MI",
    team_b: "GT",
    match_time: new Date(Date.now() + 172800000).toISOString(), // Day after
    venue: "Wankhede, Mumbai",
    status: "upcoming",
    ai_prediction: "MI",
    ai_confidence: 64,
    ai_reasoning: "Home advantage at Wankhede and superior death bowling depth give MI a tactical edge in high-scoring encounters."
  },
  {
    id: "3",
    sport_id: "cricket",
    team_a: "LSG",
    team_b: "KKR",
    match_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    venue: "Ekana Stadium, Lucknow",
    status: "live",
    ai_prediction: "KKR",
    ai_confidence: 58,
    ai_reasoning: "KKR's power hitters are better equipped for the slow bounce at Ekana. Historical data shows LSG struggles when chasing targets above 160."
  }
];
