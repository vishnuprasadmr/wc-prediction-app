-- Department filter, match reactions, admin stats, pick distribution (finished matches only)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS glory_opt_in BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS match_reactions (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('fire', 'heart', 'skull', 'clap')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_reactions_match ON match_reactions(match_id);

ALTER TABLE match_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS match_reactions_select ON match_reactions;
DROP POLICY IF EXISTS match_reactions_insert ON match_reactions;
DROP POLICY IF EXISTS match_reactions_update ON match_reactions;
DROP POLICY IF EXISTS match_reactions_delete ON match_reactions;

CREATE POLICY match_reactions_select ON match_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY match_reactions_insert ON match_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY match_reactions_update ON match_reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY match_reactions_delete ON match_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON match_reactions TO authenticated;

-- Aggregated picks — only after match is finished (no spoilers)
CREATE OR REPLACE FUNCTION get_match_pick_stats(match_uuid UUID)
RETURNS TABLE (
  home_pred INTEGER,
  away_pred INTEGER,
  pick_count BIGINT
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_uuid AND m.status = 'finished'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.home_pred, p.away_pred, COUNT(*)::BIGINT
  FROM predictions p
  WHERE p.match_id = match_uuid
  GROUP BY p.home_pred, p.away_pred
  ORDER BY COUNT(*) DESC, p.home_pred DESC, p.away_pred DESC
  LIMIT 8;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_match_pick_stats(UUID) TO authenticated;

-- Admin league health snapshot
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT json_build_object(
    'total_players', (SELECT COUNT(*)::INT FROM profiles),
    'with_employee_id', (
      SELECT COUNT(*)::INT FROM profiles
      WHERE employee_id IS NOT NULL AND employee_id ~ '^SML [0-9]+$'
    ),
    'questionnaire_done', (
      SELECT COUNT(*)::INT FROM profiles WHERE questionnaire_completed_at IS NOT NULL
    ),
    'total_predictions', (SELECT COUNT(*)::INT FROM predictions),
    'finished_matches', (
      SELECT COUNT(*)::INT FROM matches WHERE status = 'finished'
    ),
    'upcoming_in_24h', (
      SELECT COUNT(*)::INT FROM matches
      WHERE status = 'scheduled'
        AND kickoff_at <= now() + interval '24 hours'
        AND kickoff_at > now()
    ),
    'players_with_predictions', (
      SELECT COUNT(DISTINCT user_id)::INT FROM predictions
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

-- Leaderboard view with department
DROP VIEW IF EXISTS leaderboard_view;

CREATE VIEW leaderboard_view AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  p.department,
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
GROUP BY p.id, p.display_name, p.avatar_url, p.department, p.created_at, sp.points_earned;

GRANT SELECT ON leaderboard_view TO authenticated;

-- Stage leaderboard includes department for client filters
DROP FUNCTION IF EXISTS get_leaderboard_by_stage(TEXT);

CREATE FUNCTION get_leaderboard_by_stage(stage_filter TEXT)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  department TEXT,
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
    p.avatar_url,
    p.department,
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
  GROUP BY p.id, p.display_name, p.avatar_url, p.department, p.created_at
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_leaderboard_by_stage(TEXT) TO authenticated;
