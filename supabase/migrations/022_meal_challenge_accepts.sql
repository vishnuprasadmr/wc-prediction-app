-- Accept meal challenges with league points at stake (bet against creator's claim)

CREATE TYPE meal_claim_outcome AS ENUM ('home_win', 'away_win', 'draw');

CREATE TYPE meal_challenge_accept_status AS ENUM ('active', 'won', 'lost');

ALTER TABLE meal_challenges
  ADD COLUMN IF NOT EXISTS backed_outcome meal_claim_outcome NOT NULL DEFAULT 'home_win';

CREATE TABLE meal_challenge_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES meal_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_staked INTEGER NOT NULL CHECK (points_staked IN (1, 2, 3, 5)),
  status meal_challenge_accept_status NOT NULL DEFAULT 'active',
  points_delta INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

CREATE INDEX idx_meal_acceptances_challenge ON meal_challenge_acceptances(challenge_id);
CREATE INDEX idx_meal_acceptances_user ON meal_challenge_acceptances(user_id);

CREATE TABLE meal_challenge_point_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES meal_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_delta INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('creator', 'acceptor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_point_settlements_user ON meal_challenge_point_settlements(user_id);

ALTER TABLE meal_challenge_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_challenge_point_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY meal_acceptances_select ON meal_challenge_acceptances
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_challenges mc
      WHERE mc.id = challenge_id
        AND (
          mc.status IN ('approved', 'settled')
          OR mc.creator_id = auth.uid()
          OR user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        )
    )
  );

CREATE POLICY meal_acceptances_insert ON meal_challenge_acceptances
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY meal_point_settlements_select ON meal_challenge_point_settlements
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT, INSERT ON meal_challenge_acceptances TO authenticated;
GRANT SELECT ON meal_challenge_point_settlements TO authenticated;

-- Available points = leaderboard total minus active stakes on open challenges
CREATE OR REPLACE FUNCTION meal_bet_points_reserved(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(a.points_staked), 0)::INTEGER
  FROM meal_challenge_acceptances a
  INNER JOIN meal_challenges mc ON mc.id = a.challenge_id
  WHERE a.user_id = p_user_id
    AND a.status = 'active'
    AND mc.status = 'approved';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION accept_meal_challenge(
  p_challenge_id UUID,
  p_points_staked INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_challenge meal_challenges%ROWTYPE;
  v_match matches%ROWTYPE;
  v_lock_at TIMESTAMPTZ;
  v_total_points INTEGER;
  v_reserved INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sign in to accept a challenge');
  END IF;

  IF p_points_staked NOT IN (1, 2, 3, 5) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Stake must be 1, 2, 3, or 5 points');
  END IF;

  SELECT * INTO v_challenge FROM meal_challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge not found');
  END IF;

  IF v_challenge.status <> 'approved' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'This challenge is not live');
  END IF;

  IF v_challenge.creator_id = v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'message', 'You cannot accept your own challenge');
  END IF;

  IF EXISTS (
    SELECT 1 FROM meal_challenge_acceptances
    WHERE challenge_id = p_challenge_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'You already accepted this challenge');
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = v_challenge.match_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Match not found');
  END IF;

  v_lock_at := v_match.kickoff_at - INTERVAL '15 minutes';
  IF v_match.status IN ('live', 'finished') OR now() >= v_lock_at THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Acceptance closed — predictions are locked');
  END IF;

  SELECT lv.total_points INTO v_total_points
  FROM leaderboard_view lv
  WHERE lv.user_id = v_user_id;

  v_total_points := COALESCE(v_total_points, 0);
  v_reserved := meal_bet_points_reserved(v_user_id);

  IF (v_total_points - v_reserved) < p_points_staked THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message',
      format('Not enough points — %s available after open bets', GREATEST(v_total_points - v_reserved, 0))
    );
  END IF;

  INSERT INTO meal_challenge_acceptances (challenge_id, user_id, points_staked)
  VALUES (p_challenge_id, v_user_id, p_points_staked);

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION accept_meal_challenge(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION meal_bet_points_reserved(UUID) TO authenticated;

-- Finalize challenge + meal winner + point transfers (admin only)
CREATE OR REPLACE FUNCTION finalize_meal_challenge(
  p_challenge_id UUID,
  p_winner_user_id UUID,
  p_winner_note TEXT,
  p_claim_correct BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_challenge meal_challenges%ROWTYPE;
  v_acceptance meal_challenge_acceptances%ROWTYPE;
  v_creator_delta INTEGER := 0;
  v_acceptor_delta INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND is_admin = true) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Admin only');
  END IF;

  SELECT * INTO v_challenge FROM meal_challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge not found');
  END IF;

  IF v_challenge.status <> 'approved' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge is not live');
  END IF;

  UPDATE meal_challenges
  SET
    status = 'settled',
    winner_user_id = p_winner_user_id,
    winner_note = p_winner_note,
    settled_at = now(),
    settled_by = v_admin_id,
    updated_at = now()
  WHERE id = p_challenge_id;

  FOR v_acceptance IN
    SELECT * FROM meal_challenge_acceptances
    WHERE challenge_id = p_challenge_id AND status = 'active'
  LOOP
    IF p_claim_correct THEN
      v_acceptor_delta := -v_acceptance.points_staked;
      v_creator_delta := v_creator_delta + v_acceptance.points_staked;
      UPDATE meal_challenge_acceptances
      SET status = 'lost', points_delta = v_acceptor_delta
      WHERE id = v_acceptance.id;
    ELSE
      v_acceptor_delta := v_acceptance.points_staked;
      v_creator_delta := v_creator_delta - v_acceptance.points_staked;
      UPDATE meal_challenge_acceptances
      SET status = 'won', points_delta = v_acceptor_delta
      WHERE id = v_acceptance.id;
    END IF;

    INSERT INTO meal_challenge_point_settlements (challenge_id, user_id, points_delta, role)
    VALUES (p_challenge_id, v_acceptance.user_id, v_acceptor_delta, 'acceptor');
  END LOOP;

  IF v_creator_delta <> 0 THEN
    INSERT INTO meal_challenge_point_settlements (challenge_id, user_id, points_delta, role)
    VALUES (p_challenge_id, v_challenge.creator_id, v_creator_delta, 'creator');
  END IF;

  RETURN jsonb_build_object('ok', true, 'creator_points_delta', v_creator_delta);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION finalize_meal_challenge(UUID, UUID, TEXT, BOOLEAN) TO authenticated;

-- Fold meal-bet points into leaderboard
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
  )::INTEGER AS total_points,
  COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER AS exact_scores,
  COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER AS early_bonuses,
  COALESCE(sp.points_earned, 0)::INTEGER AS season_bonuses,
  COALESCE(mcp.meal_bet_points, 0)::INTEGER AS meal_bet_points,
  COUNT(pr.id)::INTEGER AS predictions_made,
  MIN(pr.created_at) AS earliest_prediction_at,
  MAX(pr.updated_at) AS last_prediction_at,
  RANK() OVER (
    ORDER BY
      (
        COALESCE(SUM(pr.points_earned), 0)
        + COALESCE(sp.points_earned, 0)
        + COALESCE(mcp.meal_bet_points, 0)
      ) DESC,
      COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0) DESC,
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
WHERE COALESCE(p.is_admin, false) = false
GROUP BY p.id, p.display_name, p.avatar_url, p.created_at, sp.points_earned, mcp.meal_bet_points;

GRANT SELECT ON leaderboard_view TO authenticated;

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
        COALESCE(SUM(pr.points_earned), 0)
        + COALESCE(sp.points_earned, 0)
        + COALESCE(mcp.meal_bet_points, 0)
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
    WHERE COALESCE(p.is_admin, false) = false
      AND p.employee_id ~ '^SML [0-9]+$'
    GROUP BY p.id, p.display_name, p.avatar_url, p.created_at, sp.points_earned, mcp.meal_bet_points
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
      AND p.employee_id ~ '^SML [0-9]+$'
    GROUP BY p.id, p.display_name, p.avatar_url, p.created_at, mcp.meal_bet_points
    ORDER BY rank;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_simelabs_leaderboard(TEXT) TO authenticated;
