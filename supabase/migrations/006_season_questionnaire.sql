-- Pre-tournament season questionnaire (Golden Boot, World Cup winner, etc.)
-- Bonus points settled after the Final via settle_season_predictions()

-- Prerequisite from 005 (safe if already applied)
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS first_bonus INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION recalculate_match_points(match_uuid UUID)
RETURNS void AS $$
DECLARE
  m RECORD;
BEGIN
  SELECT * INTO m FROM matches WHERE id = match_uuid;

  IF m.status != 'finished' OR m.home_score IS NULL OR m.away_score IS NULL THEN
    UPDATE predictions
    SET points_earned = NULL, first_bonus = 0
    WHERE match_id = match_uuid;
    RETURN;
  END IF;

  UPDATE predictions
  SET
    first_bonus = 0,
    points_earned = calculate_match_points(home_pred, away_pred, m.home_score, m.away_score)
  WHERE match_id = match_uuid;

  WITH scored AS (
    SELECT id, home_pred, away_pred, created_at, points_earned AS base_pts
    FROM predictions
    WHERE match_id = match_uuid AND points_earned > 0
  ),
  earliest AS (
    SELECT DISTINCT ON (home_pred, away_pred)
      id
    FROM scored
    ORDER BY home_pred, away_pred, created_at ASC, id ASC
  )
  UPDATE predictions p
  SET
    first_bonus = 1,
    points_earned = p.points_earned + 1
  FROM earliest e
  WHERE p.id = e.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS questionnaire_completed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS season_predictions (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  points_earned INTEGER,
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS season_official_results (
  result_key TEXT PRIMARY KEY,
  result_value TEXT NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_season_predictions_submitted
  ON season_predictions (submitted_at);

ALTER TABLE season_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_official_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS season_predictions_select ON season_predictions;
DROP POLICY IF EXISTS season_predictions_insert ON season_predictions;
DROP POLICY IF EXISTS season_predictions_update ON season_predictions;
DROP POLICY IF EXISTS season_official_results_select ON season_official_results;
DROP POLICY IF EXISTS season_official_results_admin ON season_official_results;

CREATE POLICY season_predictions_select ON season_predictions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY season_predictions_insert ON season_predictions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY season_predictions_update ON season_predictions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY season_official_results_select ON season_official_results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY season_official_results_admin ON season_official_results
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

GRANT SELECT, INSERT, UPDATE ON season_predictions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON season_official_results TO authenticated;

CREATE OR REPLACE FUNCTION normalize_season_answer(val TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(trim(coalesce(val, '')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION season_answer_points(
  user_answer TEXT,
  official_answer TEXT,
  points INTEGER
)
RETURNS INTEGER AS $$
BEGIN
  IF official_answer IS NULL OR trim(official_answer) = '' THEN
    RETURN 0;
  END IF;
  IF normalize_season_answer(user_answer) = normalize_season_answer(official_answer) THEN
    RETURN points;
  END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION settle_season_predictions()
RETURNS INTEGER AS $$
DECLARE
  settled_count INTEGER := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  WITH officials AS (
    SELECT
      MAX(CASE WHEN result_key = 'world_cup_winner' THEN result_value END) AS world_cup_winner,
      MAX(CASE WHEN result_key = 'runner_up' THEN result_value END) AS runner_up,
      MAX(CASE WHEN result_key = 'golden_boot' THEN result_value END) AS golden_boot,
      MAX(CASE WHEN result_key = 'dark_horse' THEN result_value END) AS dark_horse,
      MAX(CASE WHEN result_key = 'top_scoring_team' THEN result_value END) AS top_scoring_team
    FROM season_official_results
  ),
  scored AS (
    SELECT
      sp.user_id,
      (
        season_answer_points(sp.answers->>'world_cup_winner', o.world_cup_winner, 15) +
        season_answer_points(sp.answers->>'runner_up', o.runner_up, 6) +
        season_answer_points(sp.answers->>'golden_boot', o.golden_boot, 8) +
        season_answer_points(sp.answers->>'dark_horse', o.dark_horse, 6) +
        season_answer_points(sp.answers->>'top_scoring_team', o.top_scoring_team, 5)
      )::INTEGER AS pts
    FROM season_predictions sp
    CROSS JOIN officials o
    WHERE sp.submitted_at IS NOT NULL
  )
  UPDATE season_predictions sp
  SET
    points_earned = scored.pts,
    updated_at = now()
  FROM scored
  WHERE sp.user_id = scored.user_id;

  GET DIAGNOSTICS settled_count = ROW_COUNT;
  RETURN settled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION settle_season_predictions() TO authenticated;

-- Must drop first: CREATE OR REPLACE cannot reorder/rename view columns (42P16)
DROP VIEW IF EXISTS leaderboard_view;

CREATE VIEW leaderboard_view AS
SELECT
  p.id AS user_id,
  p.display_name,
  (
    COALESCE(SUM(pr.points_earned), 0) + COALESCE(sp.points_earned, 0)
  )::INTEGER AS total_points,
  COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER AS exact_scores,
  COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER AS early_bonuses,
  COALESCE(sp.points_earned, 0)::INTEGER AS season_bonuses,
  COUNT(pr.id)::INTEGER AS predictions_made,
  MIN(pr.created_at) AS earliest_prediction_at,
  RANK() OVER (
    ORDER BY
      (COALESCE(SUM(pr.points_earned), 0) + COALESCE(sp.points_earned, 0)) DESC,
      COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
      COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
      COALESCE(sp.points_earned, 0) DESC,
      MIN(pr.created_at) ASC,
      p.created_at ASC
  )::INTEGER AS rank
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
LEFT JOIN season_predictions sp ON sp.user_id = p.id
GROUP BY p.id, p.display_name, p.created_at, sp.points_earned;

GRANT SELECT ON leaderboard_view TO authenticated;

-- Return type changed (early_bonuses column); REPLACE is not allowed (42P13)
DROP FUNCTION IF EXISTS get_leaderboard_by_stage(TEXT);

CREATE FUNCTION get_leaderboard_by_stage(stage_filter TEXT)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  total_points INTEGER,
  exact_scores INTEGER,
  early_bonuses INTEGER,
  predictions_made INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    COALESCE(SUM(pr.points_earned), 0)::INTEGER,
    COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
    COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER,
    COUNT(pr.id)::INTEGER,
    RANK() OVER (
      ORDER BY
        COALESCE(SUM(pr.points_earned), 0) DESC,
        COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
        COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
        MIN(pr.created_at) ASC,
        p.created_at ASC
    )::INTEGER
  FROM profiles p
  INNER JOIN predictions pr ON pr.user_id = p.id
  INNER JOIN matches m ON m.id = pr.match_id AND m.stage = stage_filter
  GROUP BY p.id, p.display_name, p.created_at
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_leaderboard_by_stage(TEXT) TO authenticated;
