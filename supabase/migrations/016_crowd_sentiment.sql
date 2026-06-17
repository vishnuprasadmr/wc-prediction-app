-- Crowd sentiment after lock (outcome % only) + named reveal after full-time

CREATE OR REPLACE FUNCTION get_match_crowd_sentiment(match_uuid UUID)
RETURNS TABLE (
  home_win_pct INTEGER,
  draw_pct INTEGER,
  away_win_pct INTEGER,
  total_picks BIGINT
) AS $$
DECLARE
  lock_at TIMESTAMPTZ;
  match_status TEXT;
BEGIN
  SELECT m.kickoff_at - INTERVAL '15 minutes', m.status::TEXT
  INTO lock_at, match_status
  FROM matches m
  WHERE m.id = match_uuid;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF match_status NOT IN ('live', 'finished') AND NOW() < lock_at THEN
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

GRANT EXECUTE ON FUNCTION get_match_crowd_sentiment(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_match_pick_reveal(match_uuid UUID)
RETURNS TABLE (
  display_name TEXT,
  home_pred INTEGER,
  away_pred INTEGER,
  avatar_url TEXT
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_uuid AND m.status = 'finished'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(NULLIF(TRIM(pr.display_name), ''), 'Player') AS display_name,
    p.home_pred,
    p.away_pred,
    pr.avatar_url
  FROM predictions p
  INNER JOIN profiles pr ON pr.id = p.user_id
  WHERE p.match_id = match_uuid
  ORDER BY p.home_pred DESC, p.away_pred DESC, pr.display_name ASC
  LIMIT 24;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_match_pick_reveal(UUID) TO authenticated;
