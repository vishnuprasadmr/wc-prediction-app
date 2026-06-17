-- Aggregate outcome % from user picks for upcoming share cards (no names, any time before FT)

CREATE OR REPLACE FUNCTION get_match_pick_preview(match_uuid UUID)
RETURNS TABLE (
  home_win_pct INTEGER,
  draw_pct INTEGER,
  away_win_pct INTEGER,
  total_picks BIGINT
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_uuid AND m.status != 'finished'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH agg AS (
    SELECT
      COUNT(*) FILTER (WHERE p.home_pred > p.away_pred)::BIGINT AS home_wins,
      COUNT(*) FILTER (WHERE p.home_pred = p.away_pred)::BIGINT AS draws,
      COUNT(*) FILTER (WHERE p.home_pred < p.away_pred)::BIGINT AS away_wins,
      COUNT(*)::BIGINT AS total
    FROM predictions p
    WHERE p.match_id = match_uuid
  )
  SELECT
    CASE WHEN total > 0 THEN ROUND(100.0 * home_wins / total)::INTEGER ELSE 0 END,
    CASE WHEN total > 0 THEN ROUND(100.0 * draws / total)::INTEGER ELSE 0 END,
    CASE WHEN total > 0 THEN ROUND(100.0 * away_wins / total)::INTEGER ELSE 0 END,
    total
  FROM agg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_match_pick_preview(UUID) TO authenticated;
