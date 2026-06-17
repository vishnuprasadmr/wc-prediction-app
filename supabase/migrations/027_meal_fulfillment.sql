-- Meal fulfillment proof: creator posts photo after losing the claim (acceptors won)

ALTER TABLE meal_challenges
  ADD COLUMN IF NOT EXISTS claim_correct BOOLEAN,
  ADD COLUMN IF NOT EXISTS fulfillment_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_posted_at TIMESTAMPTZ;

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

CREATE OR REPLACE FUNCTION post_meal_fulfillment(
  p_challenge_id UUID,
  p_photo_url TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_challenge meal_challenges%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sign in required');
  END IF;

  IF p_photo_url IS NULL OR length(trim(p_photo_url)) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Photo URL required');
  END IF;

  SELECT * INTO v_challenge FROM meal_challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge not found');
  END IF;

  IF v_challenge.creator_id <> v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Only the bet creator can post meal proof');
  END IF;

  IF v_challenge.status <> 'settled' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge is not settled yet');
  END IF;

  IF COALESCE(v_challenge.claim_correct, true) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Meal proof is only for lost bets');
  END IF;

  UPDATE meal_challenges
  SET
    fulfillment_photo_url = trim(p_photo_url),
    fulfillment_posted_at = now(),
    updated_at = now()
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION post_meal_fulfillment(UUID, TEXT) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-fulfillment',
  'meal-fulfillment',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS meal_fulfillment_select ON storage.objects;
CREATE POLICY meal_fulfillment_select ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'meal-fulfillment');

DROP POLICY IF EXISTS meal_fulfillment_insert ON storage.objects;
CREATE POLICY meal_fulfillment_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'meal-fulfillment'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS meal_fulfillment_update ON storage.objects;
CREATE POLICY meal_fulfillment_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'meal-fulfillment'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS meal_fulfillment_delete ON storage.objects;
CREATE POLICY meal_fulfillment_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'meal-fulfillment'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
