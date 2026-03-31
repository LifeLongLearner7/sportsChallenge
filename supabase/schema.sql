-- Profiles table for users (Aligned with real DB)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  screen_name TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  avatar_id TEXT,
  total_points INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0, -- Legacy/Secondary points column
  level INTEGER DEFAULT 1,
  accuracy FLOAT DEFAULT 0, -- Note: Named 'accuracy' in DB, not 'accuracy_rate'
  matches_predicted INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  is_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table (Aligned with real DB)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport TEXT, -- Note: TEXT in DB, not UUID reference
  tournament TEXT,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  team_a_logo TEXT,
  team_b_logo TEXT,
  match_time TIMESTAMPTZ NOT NULL,
  venue TEXT,
  status TEXT DEFAULT 'upcoming', -- upcoming, live, completed
  winner TEXT, -- Team name (e.g. 'RCB')
  ai_prediction TEXT, -- Team name
  ai_confidence FLOAT,
  ai_reasoning TEXT,
  outfoxed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- updated_at is missing in DB
);

-- Predictions table for user entries (Aligned with real DB)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  prediction TEXT NOT NULL, -- Note: Named 'prediction' in DB, not 'predicted_winner'
  points_won INTEGER DEFAULT 0, -- Note: Named 'points_won' in DB, not 'points_awarded'
  is_neural_override BOOLEAN DEFAULT FALSE, -- Note: Named 'is_neural_override' in DB, not 'beat_ai'
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Global stats for Human vs AI comparison (Optimized for scale)
CREATE TABLE global_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport TEXT DEFAULT 'cricket',
  human_accuracy FLOAT DEFAULT 0,
  ai_accuracy FLOAT DEFAULT 0,
  human_points_total BIGINT DEFAULT 0,
  ai_points_total BIGINT DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- System activity logging for cron transparency
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL, -- 'sync', 'scoring', 'result', 'prediction'
  status TEXT NOT NULL, -- 'success', 'failure'
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read access for profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public read access for matches" ON matches FOR SELECT USING (true);

CREATE POLICY "Users can view all predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Users can create their own predictions" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own predictions before match starts" ON predictions FOR UPDATE USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM matches WHERE id = match_id AND status = 'upcoming' AND match_time > NOW()
  )
);

CREATE POLICY "Public read access for global_stats" ON global_stats FOR SELECT USING (true);

-- ============================================================
-- IMPORTANT: Run these additional policies in Supabase SQL Editor
-- (service_role key bypasses RLS, but these are needed for safety)
-- ============================================================

-- Allow service role to update match results (cron job)
CREATE POLICY "Service can update matches" ON matches FOR UPDATE USING (true);

-- Allow service role to update match predictions (scoring engine)
CREATE POLICY "Service can update predictions" ON predictions FOR UPDATE USING (true);

-- Allow service role to update user profiles (scoring engine)
CREATE POLICY "Service can update profiles" ON profiles FOR UPDATE USING (true);
