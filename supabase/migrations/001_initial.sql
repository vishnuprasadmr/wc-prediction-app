-- Simelabs WC 2026 Prediction App Schema

-- Leagues
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  league_id UUID NOT NULL REFERENCES leagues(id),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_fixture_id INTEGER UNIQUE,
  stage TEXT NOT NULL,
  group_name TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_flag TEXT DEFAULT '🏳️',
  away_flag TEXT DEFAULT '🏳️',
  kickoff_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'postponed')),
  home_score INTEGER,
  away_score INTEGER,
  score_source TEXT CHECK (score_source IN ('api', 'manual')),
  manual_override BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Predictions
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_pred INTEGER NOT NULL DEFAULT 0 CHECK (home_pred >= 0 AND home_pred <= 15),
  away_pred INTEGER NOT NULL DEFAULT 0 CHECK (away_pred >= 0 AND away_pred <= 15),
  points_earned INTEGER,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, match_id)
);

-- Indexes
CREATE INDEX idx_matches_kickoff ON matches(kickoff_at);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_api_fixture ON matches(api_fixture_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_profiles_league ON profiles(league_id);

-- Scoring function (extended rules)
CREATE OR REPLACE FUNCTION calculate_match_points(
  home_pred INTEGER,
  away_pred INTEGER,
  home_actual INTEGER,
  away_actual INTEGER
) RETURNS INTEGER AS $$
DECLARE
  pred_result TEXT;
  actual_result TEXT;
  points INTEGER := 0;
BEGIN
  -- Exact score: 5 points
  IF home_pred = home_actual AND away_pred = away_actual THEN
    RETURN 5;
  END IF;

  -- Correct result: 2 points
  IF home_pred > away_pred THEN pred_result := 'home';
  ELSIF away_pred > home_pred THEN pred_result := 'away';
  ELSE pred_result := 'draw';
  END IF;

  IF home_actual > away_actual THEN actual_result := 'home';
  ELSIF away_actual > home_actual THEN actual_result := 'away';
  ELSE actual_result := 'draw';
  END IF;

  IF pred_result = actual_result THEN
    points := points + 2;
  END IF;

  -- Correct goal difference: +1
  IF (home_pred - away_pred) = (home_actual - away_actual) THEN
    points := points + 1;
  END IF;

  -- One team's goals correct: +1
  IF home_pred = home_actual OR away_pred = away_actual THEN
    points := points + 1;
  END IF;

  RETURN points;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recalculate points for a single match
CREATE OR REPLACE FUNCTION recalculate_match_points(match_uuid UUID)
RETURNS void AS $$
DECLARE
  m RECORD;
BEGIN
  SELECT * INTO m FROM matches WHERE id = match_uuid;

  IF m.status != 'finished' OR m.home_score IS NULL OR m.away_score IS NULL THEN
    UPDATE predictions SET points_earned = NULL WHERE match_id = match_uuid;
    RETURN;
  END IF;

  UPDATE predictions
  SET points_earned = calculate_match_points(home_pred, away_pred, m.home_score, m.away_score)
  WHERE match_id = match_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate all points
CREATE OR REPLACE FUNCTION recalculate_all_points()
RETURNS void AS $$
DECLARE
  m RECORD;
BEGIN
  FOR m IN SELECT id FROM matches WHERE status = 'finished' AND home_score IS NOT NULL LOOP
    PERFORM recalculate_match_points(m.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on match score update
CREATE OR REPLACE FUNCTION on_match_score_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.home_score IS DISTINCT FROM OLD.home_score
     OR NEW.away_score IS DISTINCT FROM OLD.away_score
     OR NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM recalculate_match_points(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER match_score_changed
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION on_match_score_change();

-- Lock predictions at kickoff
CREATE OR REPLACE FUNCTION check_prediction_lock()
RETURNS TRIGGER AS $$
DECLARE
  m RECORD;
BEGIN
  SELECT * INTO m FROM matches WHERE id = NEW.match_id;

  IF m.kickoff_at <= now() + interval '15 minutes' OR m.status IN ('live', 'finished') THEN
    RAISE EXCEPTION 'Predictions are locked for this match (15 min before kickoff)';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_prediction_lock
  BEFORE INSERT OR UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION check_prediction_lock();

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
  p.id AS user_id,
  p.display_name,
  COALESCE(SUM(pr.points_earned), 0)::INTEGER AS total_points,
  COALESCE(SUM(CASE WHEN pr.points_earned = 5 THEN 1 ELSE 0 END), 0)::INTEGER AS exact_scores,
  COUNT(pr.id)::INTEGER AS predictions_made,
  RANK() OVER (
    ORDER BY
      COALESCE(SUM(pr.points_earned), 0) DESC,
      COALESCE(SUM(CASE WHEN pr.points_earned = 5 THEN 1 ELSE 0 END), 0) DESC,
      p.created_at ASC
  )::INTEGER AS rank
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.display_name, p.created_at;

-- Leaderboard by stage
CREATE OR REPLACE FUNCTION get_leaderboard_by_stage(stage_filter TEXT)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  total_points INTEGER,
  exact_scores INTEGER,
  predictions_made INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    COALESCE(SUM(pr.points_earned), 0)::INTEGER,
    COALESCE(SUM(CASE WHEN pr.points_earned = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
    COUNT(pr.id)::INTEGER,
    RANK() OVER (
      ORDER BY
        COALESCE(SUM(pr.points_earned), 0) DESC,
        COALESCE(SUM(CASE WHEN pr.points_earned = 5 THEN 1 ELSE 0 END), 0) DESC,
        p.created_at ASC
    )::INTEGER
  FROM profiles p
  LEFT JOIN predictions pr ON pr.user_id = p.id
  LEFT JOIN matches m ON m.id = pr.match_id
  WHERE m.stage = stage_filter OR pr.id IS NULL
  GROUP BY p.id, p.display_name, p.created_at
  HAVING COUNT(pr.id) FILTER (WHERE m.stage = stage_filter) > 0 OR COUNT(pr.id) = 0
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, league_id, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      (NEW.raw_user_meta_data->>'league_id')::UUID,
      '00000000-0000-0000-0000-000000000001'::UUID
    ),
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    league_id = EXCLUDED.league_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Leagues: authenticated users can read
CREATE POLICY "Leagues readable by authenticated" ON leagues
  FOR SELECT TO authenticated USING (true);

-- Profiles: read all in league, update own
CREATE POLICY "Profiles readable by authenticated" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Matches: all authenticated can read
CREATE POLICY "Matches readable by authenticated" ON matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update matches" ON matches
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Predictions: read all, insert/update own
CREATE POLICY "Predictions readable by authenticated" ON predictions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own predictions" ON predictions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own predictions" ON predictions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Seed Simelabs league
INSERT INTO leagues (id, name, invite_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'Simelabs WC 2026', 'SIMELABS-WC26');
