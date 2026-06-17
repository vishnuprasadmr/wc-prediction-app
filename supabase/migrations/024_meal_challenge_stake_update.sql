-- Allow acceptors to change their stake before predictions lock

CREATE OR REPLACE FUNCTION update_meal_challenge_stake(
  p_challenge_id UUID,
  p_points_staked INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_old_stake INTEGER;
  v_challenge meal_challenges%ROWTYPE;
  v_match matches%ROWTYPE;
  v_lock_at TIMESTAMPTZ;
  v_total_points INTEGER;
  v_reserved INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sign in to update your stake');
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

  SELECT points_staked INTO v_old_stake
  FROM meal_challenge_acceptances
  WHERE challenge_id = p_challenge_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'You have not accepted this challenge');
  END IF;

  IF v_old_stake = p_points_staked THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = v_challenge.match_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Match not found');
  END IF;

  v_lock_at := v_match.kickoff_at - INTERVAL '15 minutes';
  IF v_match.status IN ('live', 'finished') OR now() >= v_lock_at THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Stake locked — predictions are closed');
  END IF;

  SELECT lv.total_points INTO v_total_points
  FROM leaderboard_view lv
  WHERE lv.user_id = v_user_id;

  v_total_points := COALESCE(v_total_points, 0);
  v_reserved := meal_bet_points_reserved(v_user_id) - v_old_stake;

  IF (v_total_points - v_reserved) < p_points_staked THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message',
      format('Not enough points — %s available after open bets', GREATEST(v_total_points - v_reserved, 0))
    );
  END IF;

  UPDATE meal_challenge_acceptances
  SET points_staked = p_points_staked
  WHERE challenge_id = p_challenge_id AND user_id = v_user_id;

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_meal_challenge_stake(UUID, INTEGER) TO authenticated;
