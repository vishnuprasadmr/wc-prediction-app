-- Expose when each player last changed a match prediction (for leaderboard player sheet)

DROP VIEW IF EXISTS leaderboard_view;

CREATE VIEW leaderboard_view AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  (
    COALESCE(SUM(pr.points_earned), 0) + COALESCE(sp.points_earned, 0)
  )::INTEGER AS total_points,
  COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER AS exact_scores,
  COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER AS early_bonuses,
  COALESCE(sp.points_earned, 0)::INTEGER AS season_bonuses,
  COUNT(pr.id)::INTEGER AS predictions_made,
  MIN(pr.created_at) AS earliest_prediction_at,
  MAX(pr.updated_at) AS last_prediction_at,
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
WHERE COALESCE(p.is_admin, false) = false
GROUP BY p.id, p.display_name, p.avatar_url, p.created_at, sp.points_earned;

GRANT SELECT ON leaderboard_view TO authenticated;

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
    COALESCE(SUM(pr.points_earned), 0)::INTEGER,
    COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
    COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER,
    COUNT(pr.id)::INTEGER,
    MAX(pr.updated_at),
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
  WHERE COALESCE(p.is_admin, false) = false
  GROUP BY p.id, p.display_name, p.avatar_url, p.created_at
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
DECLARE
  caller_employee_id TEXT;
BEGIN
  SELECT p.employee_id INTO caller_employee_id
  FROM profiles p
  WHERE p.id = auth.uid();

  IF caller_employee_id IS NULL OR caller_employee_id !~ '^SML [0-9]+$' THEN
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
        COALESCE(SUM(pr.points_earned), 0) + COALESCE(sp.points_earned, 0)
      )::INTEGER,
      COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER,
      COUNT(pr.id)::INTEGER,
      MAX(pr.updated_at),
      RANK() OVER (
        ORDER BY
          (COALESCE(SUM(pr.points_earned), 0) + COALESCE(sp.points_earned, 0)) DESC,
          COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
          COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0) DESC,
          COALESCE(sp.points_earned, 0) DESC,
          MIN(pr.created_at) ASC,
          p.created_at ASC
      )::INTEGER
    FROM profiles p
    LEFT JOIN predictions pr ON pr.user_id = p.id
    LEFT JOIN season_predictions sp ON sp.user_id = p.id
    WHERE COALESCE(p.is_admin, false) = false
      AND p.employee_id ~ '^SML [0-9]+$'
    GROUP BY p.id, p.display_name, p.avatar_url, p.created_at, sp.points_earned
    ORDER BY rank;
  ELSE
    RETURN QUERY
    SELECT
      p.id,
      p.display_name,
      p.avatar_url,
      COALESCE(SUM(pr.points_earned), 0)::INTEGER,
      COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER,
      COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER,
      COUNT(pr.id)::INTEGER,
      MAX(pr.updated_at),
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
    WHERE COALESCE(p.is_admin, false) = false
      AND p.employee_id ~ '^SML [0-9]+$'
    GROUP BY p.id, p.display_name, p.avatar_url, p.created_at
    ORDER BY rank;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_simelabs_leaderboard(TEXT) TO authenticated;
