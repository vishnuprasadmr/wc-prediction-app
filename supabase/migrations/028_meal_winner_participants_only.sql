-- Meal winner must be the creator or someone who accepted the bet (not any match predictor)

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

  IF p_winner_user_id IS NOT NULL
     AND p_winner_user_id <> v_challenge.creator_id
     AND NOT EXISTS (
       SELECT 1 FROM meal_challenge_acceptances
       WHERE challenge_id = p_challenge_id AND user_id = p_winner_user_id
     ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'Meal winner must be the bet creator or an acceptor'
    );
  END IF;

  UPDATE meal_challenges
  SET
    status = 'settled',
    winner_user_id = p_winner_user_id,
    winner_note = p_winner_note,
    claim_correct = p_claim_correct,
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
