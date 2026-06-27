-- 1. Create the new tournament_scores table
CREATE TABLE tournament_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tournament TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  matches_predicted INTEGER DEFAULT 0,
  accuracy FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tournament)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE tournament_scores ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone to read the leaderboard scores
CREATE POLICY "Tournament scores are viewable by everyone" 
ON tournament_scores FOR SELECT 
USING (true);

-- 4. Only the service role (Admin backend) can insert/update scores
-- (This ensures users cannot manipulate their own scores via the API)
-- No policy needed for service_role as it bypasses RLS by default,
-- but we ensure standard users cannot INSERT/UPDATE.

-- 5. Data Migration: Populate the table dynamically from existing matches/predictions!
-- This will automatically calculate the points for every tournament based on the matches table
INSERT INTO tournament_scores (user_id, tournament, points, matches_predicted, accuracy)
SELECT 
  p.user_id,
  m.tournament,
  SUM(COALESCE(p.points_won, 0)) as points,
  COUNT(p.id) as matches_predicted,
  -- Calculate accuracy for this specific tournament
  CASE 
    WHEN COUNT(p.id) > 0 THEN (COUNT(CASE WHEN p.points_won > 0 THEN 1 END)::FLOAT / COUNT(p.id)) * 100
    ELSE 0 
  END as accuracy
FROM predictions p
JOIN matches m ON p.match_id = m.id
WHERE m.tournament IS NOT NULL
GROUP BY p.user_id, m.tournament
ON CONFLICT (user_id, tournament) DO UPDATE SET
  points = EXCLUDED.points,
  matches_predicted = EXCLUDED.matches_predicted,
  accuracy = EXCLUDED.accuracy;
