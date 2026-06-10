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
  home_flag TEXT DEFAULT 'ðŸ³ï¸',
  away_flag TEXT DEFAULT 'ðŸ³ï¸',
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
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, league_id, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    (NEW.raw_user_meta_data->>'league_id')::UUID,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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



-- Auto-generated fixture seed
CREATE OR REPLACE FUNCTION seed_match(
  p_api_id INTEGER,
  p_stage TEXT,
  p_group TEXT,
  p_home TEXT,
  p_away TEXT,
  p_home_flag TEXT,
  p_away_flag TEXT,
  p_kickoff TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
  VALUES (p_api_id, p_stage, p_group, p_home, p_away, p_home_flag, p_away_flag, p_kickoff, 'scheduled')
  ON CONFLICT (api_fixture_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

SELECT seed_match(2000, 'Group', 'A', 'Mexico', 'South Africa', 'ðŸ‡²ðŸ‡½', 'ðŸ‡¿ðŸ‡¦', '2026-06-11T09:00:00.000Z'::timestamptz);
SELECT seed_match(2001, 'Group', 'A', 'South Korea', 'UEFA Play-off D', 'ðŸ‡°ðŸ‡·', 'ðŸ‡ªðŸ‡º', '2026-06-15T12:00:00.000Z'::timestamptz);
SELECT seed_match(2002, 'Group', 'A', 'Mexico', 'South Korea', 'ðŸ‡²ðŸ‡½', 'ðŸ‡°ðŸ‡·', '2026-06-19T15:00:00.000Z'::timestamptz);
SELECT seed_match(2003, 'Group', 'A', 'South Africa', 'UEFA Play-off D', 'ðŸ‡¿ðŸ‡¦', 'ðŸ‡ªðŸ‡º', '2026-06-23T18:00:00.000Z'::timestamptz);
SELECT seed_match(2004, 'Group', 'A', 'Mexico', 'UEFA Play-off D', 'ðŸ‡²ðŸ‡½', 'ðŸ‡ªðŸ‡º', '2026-06-27T09:00:00.000Z'::timestamptz);
SELECT seed_match(2005, 'Group', 'A', 'South Africa', 'South Korea', 'ðŸ‡¿ðŸ‡¦', 'ðŸ‡°ðŸ‡·', '2026-07-01T12:00:00.000Z'::timestamptz);
SELECT seed_match(2006, 'Group', 'B', 'Canada', 'UEFA Play-off A', 'ðŸ‡¨ðŸ‡¦', 'ðŸ‡ªðŸ‡º', '2026-06-12T13:00:00.000Z'::timestamptz);
SELECT seed_match(2007, 'Group', 'B', 'Qatar', 'Switzerland', 'ðŸ‡¶ðŸ‡¦', 'ðŸ‡¨ðŸ‡­', '2026-06-16T16:00:00.000Z'::timestamptz);
SELECT seed_match(2008, 'Group', 'B', 'Canada', 'Qatar', 'ðŸ‡¨ðŸ‡¦', 'ðŸ‡¶ðŸ‡¦', '2026-06-20T07:00:00.000Z'::timestamptz);
SELECT seed_match(2009, 'Group', 'B', 'UEFA Play-off A', 'Switzerland', 'ðŸ‡ªðŸ‡º', 'ðŸ‡¨ðŸ‡­', '2026-06-24T10:00:00.000Z'::timestamptz);
SELECT seed_match(2010, 'Group', 'B', 'Canada', 'Switzerland', 'ðŸ‡¨ðŸ‡¦', 'ðŸ‡¨ðŸ‡­', '2026-06-28T13:00:00.000Z'::timestamptz);
SELECT seed_match(2011, 'Group', 'B', 'UEFA Play-off A', 'Qatar', 'ðŸ‡ªðŸ‡º', 'ðŸ‡¶ðŸ‡¦', '2026-07-02T16:00:00.000Z'::timestamptz);
SELECT seed_match(2012, 'Group', 'C', 'Brazil', 'Morocco', 'ðŸ‡§ðŸ‡·', 'ðŸ‡²ðŸ‡¦', '2026-06-13T08:00:00.000Z'::timestamptz);
SELECT seed_match(2013, 'Group', 'C', 'Haiti', 'Scotland', 'ðŸ‡­ðŸ‡¹', 'ðŸ´ó §ó ¢ó ³ó £ó ´ó ¿', '2026-06-17T11:00:00.000Z'::timestamptz);
SELECT seed_match(2014, 'Group', 'C', 'Brazil', 'Haiti', 'ðŸ‡§ðŸ‡·', 'ðŸ‡­ðŸ‡¹', '2026-06-21T14:00:00.000Z'::timestamptz);
SELECT seed_match(2015, 'Group', 'C', 'Morocco', 'Scotland', 'ðŸ‡²ðŸ‡¦', 'ðŸ´ó §ó ¢ó ³ó £ó ´ó ¿', '2026-06-25T17:00:00.000Z'::timestamptz);
SELECT seed_match(2016, 'Group', 'C', 'Brazil', 'Scotland', 'ðŸ‡§ðŸ‡·', 'ðŸ´ó §ó ¢ó ³ó £ó ´ó ¿', '2026-06-29T08:00:00.000Z'::timestamptz);
SELECT seed_match(2017, 'Group', 'C', 'Morocco', 'Haiti', 'ðŸ‡²ðŸ‡¦', 'ðŸ‡­ðŸ‡¹', '2026-07-03T11:00:00.000Z'::timestamptz);
SELECT seed_match(2018, 'Group', 'D', 'USA', 'Paraguay', 'ðŸ‡ºðŸ‡¸', 'ðŸ‡µðŸ‡¾', '2026-06-11T15:00:00.000Z'::timestamptz);
SELECT seed_match(2019, 'Group', 'D', 'Australia', 'UEFA Play-off C', 'ðŸ‡¦ðŸ‡º', 'ðŸ‡ªðŸ‡º', '2026-06-15T18:00:00.000Z'::timestamptz);
SELECT seed_match(2020, 'Group', 'D', 'USA', 'Australia', 'ðŸ‡ºðŸ‡¸', 'ðŸ‡¦ðŸ‡º', '2026-06-19T09:00:00.000Z'::timestamptz);
SELECT seed_match(2021, 'Group', 'D', 'Paraguay', 'UEFA Play-off C', 'ðŸ‡µðŸ‡¾', 'ðŸ‡ªðŸ‡º', '2026-06-23T12:00:00.000Z'::timestamptz);
SELECT seed_match(2022, 'Group', 'D', 'USA', 'UEFA Play-off C', 'ðŸ‡ºðŸ‡¸', 'ðŸ‡ªðŸ‡º', '2026-06-27T15:00:00.000Z'::timestamptz);
SELECT seed_match(2023, 'Group', 'D', 'Paraguay', 'Australia', 'ðŸ‡µðŸ‡¾', 'ðŸ‡¦ðŸ‡º', '2026-07-01T18:00:00.000Z'::timestamptz);
SELECT seed_match(2024, 'Group', 'E', 'Germany', 'CuraÃ§ao', 'ðŸ‡©ðŸ‡ª', 'ðŸ‡¨ðŸ‡¼', '2026-06-12T07:00:00.000Z'::timestamptz);
SELECT seed_match(2025, 'Group', 'E', 'Ivory Coast', 'Ecuador', 'ðŸ‡¨ðŸ‡®', 'ðŸ‡ªðŸ‡¨', '2026-06-16T10:00:00.000Z'::timestamptz);
SELECT seed_match(2026, 'Group', 'E', 'Germany', 'Ivory Coast', 'ðŸ‡©ðŸ‡ª', 'ðŸ‡¨ðŸ‡®', '2026-06-20T13:00:00.000Z'::timestamptz);
SELECT seed_match(2027, 'Group', 'E', 'CuraÃ§ao', 'Ecuador', 'ðŸ‡¨ðŸ‡¼', 'ðŸ‡ªðŸ‡¨', '2026-06-24T16:00:00.000Z'::timestamptz);
SELECT seed_match(2028, 'Group', 'E', 'Germany', 'Ecuador', 'ðŸ‡©ðŸ‡ª', 'ðŸ‡ªðŸ‡¨', '2026-06-28T07:00:00.000Z'::timestamptz);
SELECT seed_match(2029, 'Group', 'E', 'CuraÃ§ao', 'Ivory Coast', 'ðŸ‡¨ðŸ‡¼', 'ðŸ‡¨ðŸ‡®', '2026-07-02T10:00:00.000Z'::timestamptz);
SELECT seed_match(2030, 'Group', 'F', 'Netherlands', 'Japan', 'ðŸ‡³ðŸ‡±', 'ðŸ‡¯ðŸ‡µ', '2026-06-13T14:00:00.000Z'::timestamptz);
SELECT seed_match(2031, 'Group', 'F', 'UEFA Play-off B', 'Tunisia', 'ðŸ‡ªðŸ‡º', 'ðŸ‡¹ðŸ‡³', '2026-06-17T17:00:00.000Z'::timestamptz);
SELECT seed_match(2032, 'Group', 'F', 'Netherlands', 'UEFA Play-off B', 'ðŸ‡³ðŸ‡±', 'ðŸ‡ªðŸ‡º', '2026-06-21T08:00:00.000Z'::timestamptz);
SELECT seed_match(2033, 'Group', 'F', 'Japan', 'Tunisia', 'ðŸ‡¯ðŸ‡µ', 'ðŸ‡¹ðŸ‡³', '2026-06-25T11:00:00.000Z'::timestamptz);
SELECT seed_match(2034, 'Group', 'F', 'Netherlands', 'Tunisia', 'ðŸ‡³ðŸ‡±', 'ðŸ‡¹ðŸ‡³', '2026-06-29T14:00:00.000Z'::timestamptz);
SELECT seed_match(2035, 'Group', 'F', 'Japan', 'UEFA Play-off B', 'ðŸ‡¯ðŸ‡µ', 'ðŸ‡ªðŸ‡º', '2026-07-03T17:00:00.000Z'::timestamptz);
SELECT seed_match(2036, 'Group', 'G', 'Belgium', 'Egypt', 'ðŸ‡§ðŸ‡ª', 'ðŸ‡ªðŸ‡¬', '2026-06-11T09:00:00.000Z'::timestamptz);
SELECT seed_match(2037, 'Group', 'G', 'Iran', 'New Zealand', 'ðŸ‡®ðŸ‡·', 'ðŸ‡³ðŸ‡¿', '2026-06-15T12:00:00.000Z'::timestamptz);
SELECT seed_match(2038, 'Group', 'G', 'Belgium', 'Iran', 'ðŸ‡§ðŸ‡ª', 'ðŸ‡®ðŸ‡·', '2026-06-19T15:00:00.000Z'::timestamptz);
SELECT seed_match(2039, 'Group', 'G', 'Egypt', 'New Zealand', 'ðŸ‡ªðŸ‡¬', 'ðŸ‡³ðŸ‡¿', '2026-06-23T18:00:00.000Z'::timestamptz);
SELECT seed_match(2040, 'Group', 'G', 'Belgium', 'New Zealand', 'ðŸ‡§ðŸ‡ª', 'ðŸ‡³ðŸ‡¿', '2026-06-27T09:00:00.000Z'::timestamptz);
SELECT seed_match(2041, 'Group', 'G', 'Egypt', 'Iran', 'ðŸ‡ªðŸ‡¬', 'ðŸ‡®ðŸ‡·', '2026-07-01T12:00:00.000Z'::timestamptz);
SELECT seed_match(2042, 'Group', 'H', 'Spain', 'Cape Verde', 'ðŸ‡ªðŸ‡¸', 'ðŸ‡¨ðŸ‡»', '2026-06-12T13:00:00.000Z'::timestamptz);
SELECT seed_match(2043, 'Group', 'H', 'Saudi Arabia', 'Uruguay', 'ðŸ‡¸ðŸ‡¦', 'ðŸ‡ºðŸ‡¾', '2026-06-16T16:00:00.000Z'::timestamptz);
SELECT seed_match(2044, 'Group', 'H', 'Spain', 'Saudi Arabia', 'ðŸ‡ªðŸ‡¸', 'ðŸ‡¸ðŸ‡¦', '2026-06-20T07:00:00.000Z'::timestamptz);
SELECT seed_match(2045, 'Group', 'H', 'Cape Verde', 'Uruguay', 'ðŸ‡¨ðŸ‡»', 'ðŸ‡ºðŸ‡¾', '2026-06-24T10:00:00.000Z'::timestamptz);
SELECT seed_match(2046, 'Group', 'H', 'Spain', 'Uruguay', 'ðŸ‡ªðŸ‡¸', 'ðŸ‡ºðŸ‡¾', '2026-06-28T13:00:00.000Z'::timestamptz);
SELECT seed_match(2047, 'Group', 'H', 'Cape Verde', 'Saudi Arabia', 'ðŸ‡¨ðŸ‡»', 'ðŸ‡¸ðŸ‡¦', '2026-07-02T16:00:00.000Z'::timestamptz);
SELECT seed_match(2048, 'Group', 'I', 'France', 'Senegal', 'ðŸ‡«ðŸ‡·', 'ðŸ‡¸ðŸ‡³', '2026-06-13T08:00:00.000Z'::timestamptz);
SELECT seed_match(2049, 'Group', 'I', 'IC Play-off 2', 'Norway', 'ðŸŒ', 'ðŸ‡³ðŸ‡´', '2026-06-17T11:00:00.000Z'::timestamptz);
SELECT seed_match(2050, 'Group', 'I', 'France', 'IC Play-off 2', 'ðŸ‡«ðŸ‡·', 'ðŸŒ', '2026-06-21T14:00:00.000Z'::timestamptz);
SELECT seed_match(2051, 'Group', 'I', 'Senegal', 'Norway', 'ðŸ‡¸ðŸ‡³', 'ðŸ‡³ðŸ‡´', '2026-06-25T17:00:00.000Z'::timestamptz);
SELECT seed_match(2052, 'Group', 'I', 'France', 'Norway', 'ðŸ‡«ðŸ‡·', 'ðŸ‡³ðŸ‡´', '2026-06-29T08:00:00.000Z'::timestamptz);
SELECT seed_match(2053, 'Group', 'I', 'Senegal', 'IC Play-off 2', 'ðŸ‡¸ðŸ‡³', 'ðŸŒ', '2026-07-03T11:00:00.000Z'::timestamptz);
SELECT seed_match(2054, 'Group', 'J', 'Argentina', 'Algeria', 'ðŸ‡¦ðŸ‡·', 'ðŸ‡©ðŸ‡¿', '2026-06-11T15:00:00.000Z'::timestamptz);
SELECT seed_match(2055, 'Group', 'J', 'Austria', 'Jordan', 'ðŸ‡¦ðŸ‡¹', 'ðŸ‡¯ðŸ‡´', '2026-06-15T18:00:00.000Z'::timestamptz);
SELECT seed_match(2056, 'Group', 'J', 'Argentina', 'Austria', 'ðŸ‡¦ðŸ‡·', 'ðŸ‡¦ðŸ‡¹', '2026-06-19T09:00:00.000Z'::timestamptz);
SELECT seed_match(2057, 'Group', 'J', 'Algeria', 'Jordan', 'ðŸ‡©ðŸ‡¿', 'ðŸ‡¯ðŸ‡´', '2026-06-23T12:00:00.000Z'::timestamptz);
SELECT seed_match(2058, 'Group', 'J', 'Argentina', 'Jordan', 'ðŸ‡¦ðŸ‡·', 'ðŸ‡¯ðŸ‡´', '2026-06-27T15:00:00.000Z'::timestamptz);
SELECT seed_match(2059, 'Group', 'J', 'Algeria', 'Austria', 'ðŸ‡©ðŸ‡¿', 'ðŸ‡¦ðŸ‡¹', '2026-07-01T18:00:00.000Z'::timestamptz);
SELECT seed_match(2060, 'Group', 'K', 'Portugal', 'IC Play-off 1', 'ðŸ‡µðŸ‡¹', 'ðŸŒ', '2026-06-12T07:00:00.000Z'::timestamptz);
SELECT seed_match(2061, 'Group', 'K', 'Uzbekistan', 'Colombia', 'ðŸ‡ºðŸ‡¿', 'ðŸ‡¨ðŸ‡´', '2026-06-16T10:00:00.000Z'::timestamptz);
SELECT seed_match(2062, 'Group', 'K', 'Portugal', 'Uzbekistan', 'ðŸ‡µðŸ‡¹', 'ðŸ‡ºðŸ‡¿', '2026-06-20T13:00:00.000Z'::timestamptz);
SELECT seed_match(2063, 'Group', 'K', 'IC Play-off 1', 'Colombia', 'ðŸŒ', 'ðŸ‡¨ðŸ‡´', '2026-06-24T16:00:00.000Z'::timestamptz);
SELECT seed_match(2064, 'Group', 'K', 'Portugal', 'Colombia', 'ðŸ‡µðŸ‡¹', 'ðŸ‡¨ðŸ‡´', '2026-06-28T07:00:00.000Z'::timestamptz);
SELECT seed_match(2065, 'Group', 'K', 'IC Play-off 1', 'Uzbekistan', 'ðŸŒ', 'ðŸ‡ºðŸ‡¿', '2026-07-02T10:00:00.000Z'::timestamptz);
SELECT seed_match(2066, 'Group', 'L', 'England', 'Croatia', 'ðŸ´ó §ó ¢ó ¥ó ®ó §ó ¿', 'ðŸ‡­ðŸ‡·', '2026-06-13T14:00:00.000Z'::timestamptz);
SELECT seed_match(2067, 'Group', 'L', 'Ghana', 'Panama', 'ðŸ‡¬ðŸ‡­', 'ðŸ‡µðŸ‡¦', '2026-06-17T17:00:00.000Z'::timestamptz);
SELECT seed_match(2068, 'Group', 'L', 'England', 'Ghana', 'ðŸ´ó §ó ¢ó ¥ó ®ó §ó ¿', 'ðŸ‡¬ðŸ‡­', '2026-06-21T08:00:00.000Z'::timestamptz);
SELECT seed_match(2069, 'Group', 'L', 'Croatia', 'Panama', 'ðŸ‡­ðŸ‡·', 'ðŸ‡µðŸ‡¦', '2026-06-25T11:00:00.000Z'::timestamptz);
SELECT seed_match(2070, 'Group', 'L', 'England', 'Panama', 'ðŸ´ó §ó ¢ó ¥ó ®ó §ó ¿', 'ðŸ‡µðŸ‡¦', '2026-06-29T14:00:00.000Z'::timestamptz);
SELECT seed_match(2071, 'Group', 'L', 'Croatia', 'Ghana', 'ðŸ‡­ðŸ‡·', 'ðŸ‡¬ðŸ‡­', '2026-07-03T17:00:00.000Z'::timestamptz);
SELECT seed_match(3001, 'Round of 32', NULL, 'TBD', 'TBD', 'ðŸ³ï¸', 'ðŸ³ï¸', '2026-06-28T16:00:00Z'::timestamptz);
SELECT seed_match(3002, 'Round of 16', NULL, 'TBD', 'TBD', 'ðŸ³ï¸', 'ðŸ³ï¸', '2026-07-04T20:00:00Z'::timestamptz);
SELECT seed_match(3003, 'Quarter-final', NULL, 'TBD', 'TBD', 'ðŸ³ï¸', 'ðŸ³ï¸', '2026-07-09T20:00:00Z'::timestamptz);
SELECT seed_match(3004, 'Semi-final', NULL, 'TBD', 'TBD', 'ðŸ³ï¸', 'ðŸ³ï¸', '2026-07-14T20:00:00Z'::timestamptz);
SELECT seed_match(3005, 'Third place', NULL, 'TBD', 'TBD', 'ðŸ³ï¸', 'ðŸ³ï¸', '2026-07-18T20:00:00Z'::timestamptz);
SELECT seed_match(3006, 'Final', NULL, 'TBD', 'TBD', 'ðŸ³ï¸', 'ðŸ³ï¸', '2026-07-19T20:00:00Z'::timestamptz);



-- Additional grants and policies

CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

GRANT SELECT ON leaderboard_view TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_points() TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_by_stage(TEXT) TO authenticated;



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
  INNER JOIN predictions pr ON pr.user_id = p.id
  INNER JOIN matches m ON m.id = pr.match_id AND m.stage = stage_filter
  GROUP BY p.id, p.display_name, p.created_at
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



