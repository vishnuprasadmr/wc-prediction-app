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
