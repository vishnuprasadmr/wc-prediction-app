-- Meal bets: 1 pt stakes only (prevents leaderboard spikes when many acceptors lose)

ALTER TABLE meal_challenge_acceptances
  DROP CONSTRAINT IF EXISTS meal_challenge_acceptances_points_staked_check;

UPDATE meal_challenge_acceptances
SET points_staked = 1
WHERE points_staked <> 1
  AND status = 'active';

ALTER TABLE meal_challenge_acceptances
  ADD CONSTRAINT meal_challenge_acceptances_points_staked_check
  CHECK (points_staked = 1);

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

  IF p_points_staked <> 1 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Meal bets are 1 point only');
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

  IF (v_total_points - v_reserved) < 1 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message',
      format('Not enough points — %s available after open bets', GREATEST(v_total_points - v_reserved, 0))
    );
  END IF;

  INSERT INTO meal_challenge_acceptances (challenge_id, user_id, points_staked)
  VALUES (p_challenge_id, v_user_id, 1);

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_meal_challenge_stake(
  p_challenge_id UUID,
  p_points_staked INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_challenge meal_challenges%ROWTYPE;
  v_match matches%ROWTYPE;
  v_lock_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sign in to update your stake');
  END IF;

  IF p_points_staked <> 1 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Meal bets are 1 point only');
  END IF;

  SELECT * INTO v_challenge FROM meal_challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge not found');
  END IF;

  IF v_challenge.status <> 'approved' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'This challenge is not live');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM meal_challenge_acceptances
    WHERE challenge_id = p_challenge_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'You have not accepted this challenge');
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = v_challenge.match_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Match not found');
  END IF;

  v_lock_at := v_match.kickoff_at - INTERVAL '15 minutes';
  IF v_match.status IN ('live', 'finished') OR now() >= v_lock_at THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Stake locked — predictions are closed');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION accept_meal_challenge(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_meal_challenge_stake(UUID, INTEGER) TO authenticated;
