-- Leaderboard filters: admin Simelabs access, flexible SML IDs, stage totals aligned with overall view.

CREATE OR REPLACE FUNCTION is_verified_simelabs_employee_id(employee_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT employee_id ~* '^SML ?[0-9]+$'
$$ LANGUAGE sql IMMUTABLE;

-- Normalize legacy IDs (SML457 → SML 457) so Simelabs filters match client validation.
UPDATE profiles
SET employee_id = 'SML ' || (regexp_match(upper(trim(employee_id)), '^SML\s*([0-9]+)$'))[1]
WHERE employee_id IS NOT NULL
  AND employee_id ~* '^SML\s*[0-9]+$'
  AND employee_id !~ '^SML [0-9]+$';

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
    COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
    COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER,
    COUNT(pr.id)::INTEGER,
    MAX(pr.updated_at),
    RANK() OVER (
      ORDER BY
        (COALESCE(SUM(pr.points_earned), 0) + COALESCE(mcp.meal_bet_points, 0)) DESC,
        COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
        COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
        MIN(pr.created_at) ASC,
        p.created_at ASC
    )::INTEGER
  FROM profiles p
  INNER JOIN predictions pr ON pr.user_id = p.id
  INNER JOIN matches m ON m.id = pr.match_id AND m.stage = stage_filter
  LEFT JOIN (
    SELECT user_id, SUM(points_delta)::INTEGER AS meal_bet_points
    FROM meal_challenge_point_settlements
    GROUP BY user_id
  ) mcp ON mcp.user_id = p.id
  WHERE COALESCE(p.is_admin, false) = false
  GROUP BY p.id, p.display_name, p.avatar_url, p.created_at, mcp.meal_bet_points
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_leaderboard_by_stage(TEXT) TO authenticated;

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
      WHERE id = auth.uid() AND is_verified_simelabs_employee_id(employee_id)
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
      COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
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
          COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
          COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
          COALESCE(sp.points_earned, 0) DESC,
          MIN(pr.created_at) ASC,
          p.created_at ASC
      )::INTEGER
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
      COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER,
      COUNT(pr.id)::INTEGER,
      MAX(pr.updated_at),
      RANK() OVER (
        ORDER BY
          (COALESCE(SUM(pr.points_earned), 0) + COALESCE(mcp.meal_bet_points, 0)) DESC,
          COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
          COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
          MIN(pr.created_at) ASC,
          p.created_at ASC
      )::INTEGER
    FROM profiles p
    INNER JOIN predictions pr ON pr.user_id = p.id
    INNER JOIN matches m ON m.id = pr.match_id AND m.stage = stage_filter
    LEFT JOIN (
      SELECT user_id, SUM(points_delta)::INTEGER AS meal_bet_points
      FROM meal_challenge_point_settlements
      GROUP BY user_id
    ) mcp ON mcp.user_id = p.id
    WHERE COALESCE(p.is_admin, false) = false
      AND is_verified_simelabs_employee_id(p.employee_id)
    GROUP BY p.id, p.display_name, p.avatar_url, p.created_at, mcp.meal_bet_points
    ORDER BY rank;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_simelabs_leaderboard(TEXT) TO authenticated;
