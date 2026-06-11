-- Run in Supabase SQL Editor (migration 005)

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

CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
  p.id AS user_id,
  p.display_name,
  COALESCE(SUM(pr.points_earned), 0)::INTEGER AS total_points,
  COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER AS exact_scores,
  COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER AS early_bonuses,
  COUNT(pr.id)::INTEGER AS predictions_made,
  MIN(pr.created_at) AS earliest_prediction_at,
  RANK() OVER (
    ORDER BY
      COALESCE(SUM(pr.points_earned), 0) DESC,
      COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
      COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
      MIN(pr.created_at) ASC,
      p.created_at ASC
  )::INTEGER AS rank
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.display_name, p.created_at;

CREATE OR REPLACE FUNCTION get_leaderboard_by_stage(stage_filter TEXT)
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

SELECT recalculate_all_points();
