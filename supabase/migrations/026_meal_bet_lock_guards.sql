-- Block meal bets on locked matches (DB-enforced, not only via RPC)

CREATE OR REPLACE FUNCTION is_meal_bet_match_open(p_match_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_match matches%ROWTYPE;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_match.status IN ('live', 'finished', 'postponed') THEN
    RETURN false;
  END IF;

  IF now() >= v_match.kickoff_at - INTERVAL '15 minutes' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION meal_challenges_match_open_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_meal_bet_match_open(NEW.match_id) THEN
    RAISE EXCEPTION 'Cannot create a meal bet on a locked match'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meal_challenges_match_open_guard ON meal_challenges;
CREATE TRIGGER meal_challenges_match_open_guard
  BEFORE INSERT ON meal_challenges
  FOR EACH ROW
  EXECUTE FUNCTION meal_challenges_match_open_guard();

CREATE OR REPLACE FUNCTION meal_challenges_approve_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    IF NOT is_meal_bet_match_open(NEW.match_id) THEN
      RAISE EXCEPTION 'Cannot approve — match predictions are locked'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meal_challenges_approve_guard ON meal_challenges;
CREATE TRIGGER meal_challenges_approve_guard
  BEFORE UPDATE ON meal_challenges
  FOR EACH ROW
  EXECUTE FUNCTION meal_challenges_approve_guard();

CREATE OR REPLACE FUNCTION meal_challenge_acceptances_lock_guard()
RETURNS TRIGGER AS $$
DECLARE
  v_match_id UUID;
BEGIN
  SELECT match_id INTO v_match_id
  FROM meal_challenges
  WHERE id = NEW.challenge_id;

  IF v_match_id IS NULL THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  IF NOT is_meal_bet_match_open(v_match_id) THEN
    RAISE EXCEPTION 'Acceptance closed — predictions are locked'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meal_challenge_acceptances_lock_guard ON meal_challenge_acceptances;
CREATE TRIGGER meal_challenge_acceptances_lock_guard
  BEFORE INSERT ON meal_challenge_acceptances
  FOR EACH ROW
  EXECUTE FUNCTION meal_challenge_acceptances_lock_guard();

GRANT EXECUTE ON FUNCTION is_meal_bet_match_open(UUID) TO authenticated;
