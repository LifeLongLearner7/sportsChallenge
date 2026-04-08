-- Profiles table for users (Aligned with real DB)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  screen_name TEXT UNIQUE,
  avatar_url TEXT,
  avatar_id TEXT,
  points INTEGER DEFAULT 0, 
  level INTEGER DEFAULT 1,
  accuracy FLOAT DEFAULT 0, -- Note: Named 'accuracy' in DB, not 'accuracy_rate'
  matches_predicted INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  is_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE
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
  outfoxed_count INTEGER DEFAULT 0, -- Track strategists who beat the AI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tactical Registry ───────────────────────────────────────────────────────
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
  sport TEXT DEFAULT 'cricket' UNIQUE, -- Unique constraint required for tactical upserts
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

-- Allow service role to-- (Placeholder for future tactical expansion)

-- ── SECURITY FORTIFICATION (v5.0): SYSTEM INTEGRITY PULSE ──────────────────

-- 1. Profile Integrity: Protects admin status, points, and onboarding state
CREATE OR REPLACE FUNCTION protect_profile_system_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Revert system-critical columns if not updated by service_role (admin override)
  IF (auth.role() <> 'service_role' AND current_setting('role', true) <> 'service_role') THEN
    NEW.is_admin := OLD.is_admin;
    NEW.points := OLD.points;
    NEW.onboarding_completed := OLD.onboarding_completed;
    NEW.accuracy := OLD.accuracy;
    NEW.matches_predicted := OLD.matches_predicted;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_protect_profile_system_data
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_system_data();


-- 2. Prediction Integrity: Protects scoring truth
CREATE OR REPLACE FUNCTION protect_prediction_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Standard strategists can transition 'prediction' but NOT 'points_won' or 'is_correct'
  IF (auth.role() <> 'service_role' AND current_setting('role', true) <> 'service_role') THEN
    -- Initialize or protect system-critical columns based on operation type
    IF (TG_OP = 'INSERT') THEN
      NEW.points_won := 0;
      NEW.is_correct := FALSE;
      NEW.is_neural_override := FALSE;
    ELSIF (TG_OP = 'UPDATE') THEN
      NEW.points_won := OLD.points_won;
      NEW.is_correct := OLD.is_correct;
      NEW.is_neural_override := OLD.is_neural_override;
      
      -- Prevent changing the user_id or match_id of an existing prediction
      NEW.user_id := OLD.user_id;
      NEW.match_id := OLD.match_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_protect_prediction_results
  BEFORE UPDATE OR INSERT ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION protect_prediction_integrity();
CREATE POLICY "Service can update profiles" ON profiles FOR UPDATE USING (true);

-- 3. Automatic Timestamps: Automated updated_at management
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to Matches
CREATE TRIGGER trigger_update_matches_timestamp
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Attach to Profiles
CREATE TRIGGER trigger_update_profiles_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Attach to Predictions
CREATE TRIGGER trigger_update_predictions_timestamp
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ── EXTERNAL FIXTURE REGISTRY (v6.9) ─────────────────────────────────────────
-- Links internal match nodes to external CricAPI fixtures
CREATE TABLE external_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL, -- Official API ID
  series_id TEXT NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  name TEXT,
  date TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_match_series UNIQUE (match_id, series_id)
);

CREATE POLICY "Public read access for external_fixtures" ON external_fixtures FOR SELECT USING (true);
ALTER TABLE external_fixtures ENABLE ROW LEVEL SECURITY;
