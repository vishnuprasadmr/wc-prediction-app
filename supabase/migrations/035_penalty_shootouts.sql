-- Penalty shootouts for knockout matches.
-- Knockout games level after 90'/extra time go to penalties. FIFA reports the
-- regulation score (a draw) plus separate penalty totals, so without this the
-- match scores as a draw and the shootout winner is ignored.
--
-- Players who predict a draw on a knockout tie also pick who advances on
-- penalties (+2) and can optionally nail the exact shootout score (+1). These
-- points fold into predictions.points_earned (like the early-bird bonus) and are
-- tracked separately in predictions.shootout_bonus for display + exact-score math.

-- ── Match penalty results ─────────────────────────────────────────────────────
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_penalties INTEGER,
  ADD COLUMN IF NOT EXISTS away_penalties INTEGER;

-- ── Prediction shootout pick ──────────────────────────────────────────────────
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS shootout_winner TEXT
    CHECK (shootout_winner IS NULL OR shootout_winner IN ('home', 'away')),
  ADD COLUMN IF NOT EXISTS home_pen_pred INTEGER
    CHECK (home_pen_pred IS NULL OR (home_pen_pred >= 0 AND home_pen_pred <= 30)),
  ADD COLUMN IF NOT EXISTS away_pen_pred INTEGER
    CHECK (away_pen_pred IS NULL OR (away_pen_pred >= 0 AND away_pen_pred <= 30)),
  ADD COLUMN IF NOT EXISTS shootout_bonus INTEGER NOT NULL DEFAULT 0;

-- ── Scoring: base goal points + early bird + shootout bonus ────────────────────
CREATE OR REPLACE FUNCTION recalculate_match_points(match_uuid UUID)
RETURNS void AS $$
DECLARE
  m RECORD;
  v_shootout BOOLEAN := false;
  v_pen_winner TEXT;
BEGIN
  SELECT * INTO m FROM matches WHERE id = match_uuid;

  IF m.status != 'finished' OR m.home_score IS NULL OR m.away_score IS NULL THEN
    UPDATE predictions
    SET points_earned = NULL, first_bonus = 0, shootout_bonus = 0
    WHERE match_id = match_uuid;
    RETURN;
  END IF;

  -- A shootout happened only when regulation was level and FIFA reported penalties.
  IF m.home_penalties IS NOT NULL AND m.away_penalties IS NOT NULL
     AND m.home_score = m.away_score THEN
    v_shootout := true;
    v_pen_winner := CASE
      WHEN m.home_penalties > m.away_penalties THEN 'home'
      ELSE 'away'
    END;
  END IF;

  -- 1) Base goal points (resets bonuses)
  UPDATE predictions
  SET
    first_bonus = 0,
    shootout_bonus = 0,
    points_earned = calculate_match_points(home_pred, away_pred, m.home_score, m.away_score)
  WHERE match_id = match_uuid;

  -- 2) Early bird: +1 for the first to submit each winning scoreline
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

  -- 3) Shootout bonus: predicted a draw + correct team advancing (+2),
  --    plus exact penalty score (+1).
  IF v_shootout THEN
    UPDATE predictions p
    SET
      shootout_bonus = 2 + CASE
        WHEN p.home_pen_pred = m.home_penalties AND p.away_pen_pred = m.away_penalties
        THEN 1 ELSE 0 END,
      points_earned = COALESCE(p.points_earned, 0) + 2 + CASE
        WHEN p.home_pen_pred = m.home_penalties AND p.away_pen_pred = m.away_penalties
        THEN 1 ELSE 0 END
    WHERE p.match_id = match_uuid
      AND p.home_pred = p.away_pred
      AND p.shootout_winner = v_pen_winner;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalc when penalties change too (not just goals / status)
CREATE OR REPLACE FUNCTION on_match_score_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.home_score IS DISTINCT FROM OLD.home_score
     OR NEW.away_score IS DISTINCT FROM OLD.away_score
     OR NEW.home_penalties IS DISTINCT FROM OLD.home_penalties
     OR NEW.away_penalties IS DISTINCT FROM OLD.away_penalties
     OR NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM recalculate_match_points(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Leaderboards: exclude shootout bonus from exact-score detection ────────────
-- (exact score = base 5; early-bird and shootout bonuses must be subtracted out)
DROP VIEW IF EXISTS leaderboard_view;

CREATE VIEW leaderboard_view AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  (
    COALESCE(SUM(pr.points_earned), 0)
    + COALESCE(sp.points_earned, 0)
    + COALESCE(mcp.meal_bet_points, 0)
    + COALESCE(ebp.engagement_bonus_points, 0)
  )::INTEGER AS total_points,
  COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0) - COALESCE(pr.shootout_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER AS exact_scores,
  COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER AS early_bonuses,
  COALESCE(sp.points_earned, 0)::INTEGER AS season_bonuses,
  COALESCE(mcp.meal_bet_points, 0)::INTEGER AS meal_bet_points,
  COALESCE(ebp.engagement_bonus_points, 0)::INTEGER AS engagement_bonuses,
  COUNT(pr.id)::INTEGER AS predictions_made,
  MIN(pr.created_at) AS earliest_prediction_at,
  MAX(pr.updated_at) AS last_prediction_at,
  RANK() OVER (
    ORDER BY
      (
        COALESCE(SUM(pr.points_earned), 0)
        + COALESCE(sp.points_earned, 0)
        + COALESCE(mcp.meal_bet_points, 0)
        + COALESCE(ebp.engagement_bonus_points, 0)
      ) DESC,
      COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0) - COALESCE(pr.shootout_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
      COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
      COALESCE(sp.points_earned, 0) DESC,
      MIN(pr.created_at) ASC,
      p.created_at ASC
  )::INTEGER AS rank
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
LEFT JOIN season_predictions sp ON sp.user_id = p.id
LEFT JOIN (
  SELECT user_id, SUM(points_delta)::INTEGER AS meal_bet_points
  FROM meal_challenge_point_settlements
  GROUP BY user_id
) mcp ON mcp.user_id = p.id
LEFT JOIN (
  SELECT user_id, SUM(points)::INTEGER AS engagement_bonus_points
  FROM point_bonuses
  GROUP BY user_id
) ebp ON ebp.user_id = p.id
WHERE COALESCE(p.is_admin, false) = false
GROUP BY
  p.id,
  p.display_name,
  p.avatar_url,
  p.created_at,
  sp.points_earned,
  mcp.meal_bet_points,
  ebp.engagement_bonus_points;

GRANT SELECT ON leaderboard_view TO authenticated;

-- Stage leaderboard (mirrors 034, exact-score expression now subtracts shootout bonus)
DROP FUNCTION IF EXISTS get_leaderboard_by_stage(TEXT);

CREATE FUNCTION get_leaderboard_by_stage(stage_filter TEXT)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_points INTEGER,
  exact_scores INTEGER,
  early_bonuses INTEGER,
  predictions_made INTEGER,
  last_prediction_at TIMESTAMPTZ,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    (
      COALESCE(SUM(pr.points_earned), 0) + COALESCE(mcp.meal_bet_points, 0)
    )::INTEGER,
    COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0) - COALESCE(pr.shootout_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
    COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER,
    COUNT(pr.id)::INTEGER,
    MAX(pr.updated_at),
    RANK() OVER (
      ORDER BY
        (COALESCE(SUM(pr.points_earned), 0) + COALESCE(mcp.meal_bet_points, 0)) DESC,
        COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0) - COALESCE(pr.shootout_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
        COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
        MIN(pr.created_at) ASC,
        p.created_at ASC
    )::INTEGER
  FROM profiles p
  INNER JOIN predictions pr ON pr.user_id = p.id
  INNER JOIN matches m ON m.id = pr.match_id AND m.stage = stage_filter
  LEFT JOIN (
    SELECT mcps.user_id AS settlement_user_id, SUM(mcps.points_delta)::INTEGER AS meal_bet_points
    FROM meal_challenge_point_settlements mcps
    GROUP BY mcps.user_id
  ) mcp ON mcp.settlement_user_id = p.id
  WHERE COALESCE(p.is_admin, false) = false
  GROUP BY p.id, p.display_name, p.avatar_url, p.created_at, mcp.meal_bet_points
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_leaderboard_by_stage(TEXT) TO authenticated;

-- Simelabs leaderboard (mirrors 034, exact-score expression now subtracts shootout bonus)
DROP FUNCTION IF EXISTS get_simelabs_leaderboard(TEXT);

CREATE FUNCTION get_simelabs_leaderboard(stage_filter TEXT DEFAULT 'all')
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_points INTEGER,
  exact_scores INTEGER,
  early_bonuses INTEGER,
  predictions_made INTEGER,
  last_prediction_at TIMESTAMPTZ,
  rank INTEGER
) AS $$
BEGIN
  IF NOT (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND COALESCE(is_admin, false) = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_verified_simelabs_employee_id(profiles.employee_id)
    )
  ) THEN
    RAISE EXCEPTION 'Simelabs point table is for verified employees only'
      USING ERRCODE = '42501';
  END IF;

  IF stage_filter IS NULL OR stage_filter = 'all' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.display_name,
      p.avatar_url,
      (
        COALESCE(SUM(pr.points_earned), 0)
        + COALESCE(sp.points_earned, 0)
        + COALESCE(mcp.meal_bet_points, 0)
        + COALESCE(ebp.engagement_bonus_points, 0)
      )::INTEGER,
      COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0) - COALESCE(pr.shootout_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER,
      COUNT(pr.id)::INTEGER,
      MAX(pr.updated_at),
      RANK() OVER (
        ORDER BY
          (
            COALESCE(SUM(pr.points_earned), 0)
            + COALESCE(sp.points_earned, 0)
            + COALESCE(mcp.meal_bet_points, 0)
            + COALESCE(ebp.engagement_bonus_points, 0)
          ) DESC,
          COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0) - COALESCE(pr.shootout_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
          COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
          COALESCE(sp.points_earned, 0) DESC,
          MIN(pr.created_at) ASC,
          p.created_at ASC
      )::INTEGER
    FROM profiles p
    LEFT JOIN predictions pr ON pr.user_id = p.id
    LEFT JOIN season_predictions sp ON sp.user_id = p.id
    LEFT JOIN (
      SELECT mcps.user_id AS settlement_user_id, SUM(mcps.points_delta)::INTEGER AS meal_bet_points
      FROM meal_challenge_point_settlements mcps
      GROUP BY mcps.user_id
    ) mcp ON mcp.settlement_user_id = p.id
    LEFT JOIN (
      SELECT pb.user_id AS bonus_user_id, SUM(pb.points)::INTEGER AS engagement_bonus_points
      FROM point_bonuses pb
      GROUP BY pb.user_id
    ) ebp ON ebp.bonus_user_id = p.id
    WHERE COALESCE(p.is_admin, false) = false
      AND is_verified_simelabs_employee_id(p.employee_id)
    GROUP BY
      p.id,
      p.display_name,
      p.avatar_url,
      p.created_at,
      sp.points_earned,
      mcp.meal_bet_points,
      ebp.engagement_bonus_points
    ORDER BY rank;
  ELSE
    RETURN QUERY
    SELECT
      p.id,
      p.display_name,
      p.avatar_url,
      (
        COALESCE(SUM(pr.points_earned), 0) + COALESCE(mcp.meal_bet_points, 0)
      )::INTEGER,
      COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0) - COALESCE(pr.shootout_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER,
      COUNT(pr.id)::INTEGER,
      MAX(pr.updated_at),
      RANK() OVER (
        ORDER BY
          (COALESCE(SUM(pr.points_earned), 0) + COALESCE(mcp.meal_bet_points, 0)) DESC,
          COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0) - COALESCE(pr.shootout_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
          COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
          MIN(pr.created_at) ASC,
          p.created_at ASC
      )::INTEGER
    FROM profiles p
    INNER JOIN predictions pr ON pr.user_id = p.id
    INNER JOIN matches m ON m.id = pr.match_id AND m.stage = stage_filter
    LEFT JOIN (
      SELECT mcps.user_id AS settlement_user_id, SUM(mcps.points_delta)::INTEGER AS meal_bet_points
      FROM meal_challenge_point_settlements mcps
      GROUP BY mcps.user_id
    ) mcp ON mcp.settlement_user_id = p.id
    WHERE COALESCE(p.is_admin, false) = false
      AND is_verified_simelabs_employee_id(p.employee_id)
    GROUP BY p.id, p.display_name, p.avatar_url, p.created_at, mcp.meal_bet_points
    ORDER BY rank;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_simelabs_leaderboard(TEXT) TO authenticated;

-- Re-score any already-finished knockout matches that had shootouts
SELECT recalculate_all_points();
