-- PvP penalty shootout arena: challenges, kicks, hero picks

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS arena_hero JSONB;

CREATE TYPE shootout_challenge_status AS ENUM (
  'pending',
  'active',
  'completed',
  'declined',
  'cancelled',
  'expired'
);

CREATE TYPE shootout_phase AS ENUM (
  'keeper_dive',
  'shooter_shoot',
  'completed'
);

CREATE TYPE shootout_zone AS ENUM (
  'far_left',
  'left',
  'center',
  'right',
  'far_right'
);

CREATE TYPE shootout_kick_outcome AS ENUM ('goal', 'save');

CREATE TABLE shootout_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status shootout_challenge_status NOT NULL DEFAULT 'pending',
  phase shootout_phase NOT NULL DEFAULT 'keeper_dive',
  kick_number INTEGER NOT NULL DEFAULT 1 CHECK (kick_number >= 1),
  challenger_score INTEGER NOT NULL DEFAULT 0 CHECK (challenger_score >= 0),
  opponent_score INTEGER NOT NULL DEFAULT 0 CHECK (opponent_score >= 0),
  active_kicker_id UUID NOT NULL REFERENCES profiles(id),
  active_keeper_id UUID NOT NULL REFERENCES profiles(id),
  turn_user_id UUID NOT NULL REFERENCES profiles(id),
  winner_id UUID REFERENCES profiles(id),
  challenger_hero JSONB,
  opponent_hero JSONB,
  taunt_text TEXT CHECK (taunt_text IS NULL OR char_length(taunt_text) <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  completed_at TIMESTAMPTZ,
  CONSTRAINT shootout_distinct_players CHECK (challenger_id <> opponent_id)
);

CREATE INDEX idx_shootout_challenges_challenger ON shootout_challenges(challenger_id);
CREATE INDEX idx_shootout_challenges_opponent ON shootout_challenges(opponent_id);
CREATE INDEX idx_shootout_challenges_status ON shootout_challenges(status);

CREATE TABLE shootout_kicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES shootout_challenges(id) ON DELETE CASCADE,
  kick_number INTEGER NOT NULL CHECK (kick_number >= 1),
  kicker_id UUID NOT NULL REFERENCES profiles(id),
  keeper_id UUID NOT NULL REFERENCES profiles(id),
  dive_zone shootout_zone,
  shot_zone shootout_zone,
  outcome shootout_kick_outcome,
  banter_line TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE (challenge_id, kick_number)
);

CREATE INDEX idx_shootout_kicks_challenge ON shootout_kicks(challenge_id);

ALTER TABLE shootout_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE shootout_kicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY shootout_challenges_select ON shootout_challenges
  FOR SELECT TO authenticated
  USING (
    challenger_id = auth.uid()
    OR opponent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY shootout_challenges_insert ON shootout_challenges
  FOR INSERT TO authenticated
  WITH CHECK (challenger_id = auth.uid());

CREATE POLICY shootout_kicks_select ON shootout_kicks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shootout_challenges c
      WHERE c.id = challenge_id
        AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
    )
  );

GRANT SELECT, INSERT ON shootout_challenges TO authenticated;
GRANT SELECT ON shootout_kicks TO authenticated;

-- Helpers
CREATE OR REPLACE FUNCTION shootout_kicker_for_kick(p_challenger_id UUID, p_kick_number INTEGER)
RETURNS UUID AS $$
BEGIN
  IF p_kick_number % 2 = 1 THEN
    RETURN p_challenger_id;
  END IF;
  RETURN NULL; -- caller supplies opponent via challenge row
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION shootout_is_complete(
  p_kick_number INTEGER,
  p_challenger_score INTEGER,
  p_opponent_score INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_kick_number < 10 THEN
    RETURN false;
  END IF;
  IF p_challenger_score <> p_opponent_score THEN
    RETURN true;
  END IF;
  IF p_kick_number >= 10 AND p_kick_number % 2 = 0 THEN
    RETURN false;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION create_shootout_challenge(
  p_opponent_id UUID,
  p_taunt TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_hero JSONB;
  v_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sign in required');
  END IF;

  IF p_opponent_id = v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'message', 'You cannot challenge yourself');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_opponent_id) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Player not found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM shootout_challenges
    WHERE status IN ('pending', 'active')
      AND (
        (challenger_id = v_user_id AND opponent_id = p_opponent_id)
        OR (challenger_id = p_opponent_id AND opponent_id = v_user_id)
      )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'You already have an open challenge with this player');
  END IF;

  SELECT arena_hero INTO v_hero FROM profiles WHERE id = v_user_id;

  INSERT INTO shootout_challenges (
    challenger_id,
    opponent_id,
    status,
    phase,
    kick_number,
    active_kicker_id,
    active_keeper_id,
    turn_user_id,
    challenger_hero,
    taunt_text
  ) VALUES (
    v_user_id,
    p_opponent_id,
    'pending',
    'keeper_dive',
    1,
    v_user_id,
    p_opponent_id,
    p_opponent_id,
    v_hero,
    NULLIF(trim(p_taunt), '')
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'challenge_id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION respond_shootout_challenge(
  p_challenge_id UUID,
  p_accept BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_challenge shootout_challenges%ROWTYPE;
  v_hero JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sign in required');
  END IF;

  SELECT * INTO v_challenge FROM shootout_challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge not found');
  END IF;

  IF v_challenge.opponent_id <> v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Only the challenged player can respond');
  END IF;

  IF v_challenge.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge is no longer pending');
  END IF;

  IF NOT p_accept THEN
    UPDATE shootout_challenges
    SET status = 'declined', updated_at = now()
    WHERE id = p_challenge_id;
    RETURN jsonb_build_object('ok', true, 'status', 'declined');
  END IF;

  SELECT arena_hero INTO v_hero FROM profiles WHERE id = v_user_id;

  UPDATE shootout_challenges
  SET
    status = 'active',
    phase = 'keeper_dive',
    kick_number = 1,
    active_kicker_id = challenger_id,
    active_keeper_id = opponent_id,
    turn_user_id = opponent_id,
    opponent_hero = v_hero,
    updated_at = now()
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object('ok', true, 'status', 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_shootout_dive(
  p_challenge_id UUID,
  p_zone shootout_zone
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_challenge shootout_challenges%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sign in required');
  END IF;

  SELECT * INTO v_challenge FROM shootout_challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge not found');
  END IF;

  IF v_challenge.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge is not active');
  END IF;

  IF v_challenge.phase <> 'keeper_dive' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Not keeper dive phase');
  END IF;

  IF v_challenge.turn_user_id <> v_user_id OR v_challenge.active_keeper_id <> v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Not your turn to dive');
  END IF;

  INSERT INTO shootout_kicks (challenge_id, kick_number, kicker_id, keeper_id, dive_zone)
  VALUES (
    p_challenge_id,
    v_challenge.kick_number,
    v_challenge.active_kicker_id,
    v_challenge.active_keeper_id,
    p_zone
  );

  UPDATE shootout_challenges
  SET
    phase = 'shooter_shoot',
    turn_user_id = active_kicker_id,
    updated_at = now()
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object('ok', true, 'phase', 'shooter_shoot');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_shootout_shot(
  p_challenge_id UUID,
  p_zone shootout_zone,
  p_banter TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_challenge shootout_challenges%ROWTYPE;
  v_kick shootout_kicks%ROWTYPE;
  v_outcome shootout_kick_outcome;
  v_next_kicker UUID;
  v_next_keeper UUID;
  v_next_kick INTEGER;
  v_complete BOOLEAN;
  v_winner UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sign in required');
  END IF;

  SELECT * INTO v_challenge FROM shootout_challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge not found');
  END IF;

  IF v_challenge.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Challenge is not active');
  END IF;

  IF v_challenge.phase <> 'shooter_shoot' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Not shooter phase');
  END IF;

  IF v_challenge.turn_user_id <> v_user_id OR v_challenge.active_kicker_id <> v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Not your turn to shoot');
  END IF;

  SELECT * INTO v_kick FROM shootout_kicks
  WHERE challenge_id = p_challenge_id AND kick_number = v_challenge.kick_number
  FOR UPDATE;

  IF NOT FOUND OR v_kick.dive_zone IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Keeper dive missing');
  END IF;

  IF p_zone = v_kick.dive_zone THEN
    v_outcome := 'save';
  ELSE
    v_outcome := 'goal';
  END IF;

  UPDATE shootout_kicks
  SET
    shot_zone = p_zone,
    outcome = v_outcome,
    banter_line = NULLIF(trim(p_banter), ''),
    resolved_at = now()
  WHERE id = v_kick.id;

  IF v_outcome = 'goal' THEN
    IF v_challenge.active_kicker_id = v_challenge.challenger_id THEN
      UPDATE shootout_challenges SET challenger_score = challenger_score + 1 WHERE id = p_challenge_id;
    ELSE
      UPDATE shootout_challenges SET opponent_score = opponent_score + 1 WHERE id = p_challenge_id;
    END IF;
  END IF;

  SELECT * INTO v_challenge FROM shootout_challenges WHERE id = p_challenge_id;

  v_complete := false;
  IF v_challenge.kick_number >= 10 AND v_challenge.challenger_score <> v_challenge.opponent_score THEN
    v_complete := true;
  ELSIF v_challenge.kick_number > 10
        AND v_challenge.kick_number % 2 = 0
        AND v_challenge.challenger_score <> v_challenge.opponent_score THEN
    v_complete := true;
  END IF;

  IF v_complete THEN
    IF v_challenge.challenger_score > v_challenge.opponent_score THEN
      v_winner := v_challenge.challenger_id;
    ELSE
      v_winner := v_challenge.opponent_id;
    END IF;

    UPDATE shootout_challenges
    SET
      status = 'completed',
      phase = 'completed',
      winner_id = v_winner,
      turn_user_id = v_winner,
      completed_at = now(),
      updated_at = now()
    WHERE id = p_challenge_id;

    RETURN jsonb_build_object(
      'ok', true,
      'outcome', v_outcome,
      'completed', true,
      'winner_id', v_winner
    );
  END IF;

  v_next_kick := v_challenge.kick_number + 1;

  IF v_next_kick % 2 = 1 THEN
    v_next_kicker := v_challenge.challenger_id;
    v_next_keeper := v_challenge.opponent_id;
  ELSE
    v_next_kicker := v_challenge.opponent_id;
    v_next_keeper := v_challenge.challenger_id;
  END IF;

  UPDATE shootout_challenges
  SET
    kick_number = v_next_kick,
    phase = 'keeper_dive',
    active_kicker_id = v_next_kicker,
    active_keeper_id = v_next_keeper,
    turn_user_id = v_next_keeper,
    updated_at = now()
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object(
    'ok', true,
    'outcome', v_outcome,
    'completed', false,
    'next_kick', v_next_kick
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_shootout_challenge(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION respond_shootout_challenge(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_shootout_dive(UUID, shootout_zone) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_shootout_shot(UUID, shootout_zone, TEXT) TO authenticated;
