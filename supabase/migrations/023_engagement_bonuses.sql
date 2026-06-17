-- Engagement bonuses: first prediction, first share, capped referrals.
-- Counts toward leaderboard total (and meal-bet available points).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

CREATE TABLE IF NOT EXISTS point_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('first_prediction', 'first_share', 'referral')),
  points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT point_bonuses_referral_requires_user CHECK (
    reason <> 'referral' OR referred_user_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS point_bonuses_first_prediction_unique
  ON point_bonuses (user_id)
  WHERE reason = 'first_prediction';

CREATE UNIQUE INDEX IF NOT EXISTS point_bonuses_first_share_unique
  ON point_bonuses (user_id)
  WHERE reason = 'first_share';

CREATE UNIQUE INDEX IF NOT EXISTS point_bonuses_referral_pair_unique
  ON point_bonuses (user_id, referred_user_id)
  WHERE reason = 'referral';

CREATE INDEX IF NOT EXISTS idx_point_bonuses_user ON point_bonuses(user_id);

ALTER TABLE point_bonuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS point_bonuses_select ON point_bonuses;
CREATE POLICY point_bonuses_select ON point_bonuses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON point_bonuses TO authenticated;

CREATE OR REPLACE FUNCTION profiles_referred_by_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.referred_by IS NOT NULL
     AND NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    NEW.referred_by := OLD.referred_by;
  END IF;

  IF NEW.referred_by = NEW.id THEN
    NEW.referred_by := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_referred_by_guard ON profiles;
CREATE TRIGGER profiles_referred_by_guard
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_referred_by_guard();

CREATE OR REPLACE FUNCTION award_engagement_bonuses_on_prediction()
RETURNS TRIGGER AS $$
DECLARE
  v_prediction_count INTEGER;
  v_referrer UUID;
  v_referral_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_prediction_count
  FROM predictions
  WHERE user_id = NEW.user_id;

  IF v_prediction_count <> 1 THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM point_bonuses
    WHERE user_id = NEW.user_id AND reason = 'first_prediction'
  ) THEN
    INSERT INTO point_bonuses (user_id, reason, points)
    VALUES (NEW.user_id, 'first_prediction', 1);
  END IF;

  SELECT p.referred_by INTO v_referrer
  FROM profiles p
  WHERE p.id = NEW.user_id;

  IF v_referrer IS NULL OR v_referrer = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_referral_count
  FROM point_bonuses
  WHERE user_id = v_referrer AND reason = 'referral';

  IF v_referral_count >= 5 THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM point_bonuses
    WHERE user_id = v_referrer
      AND reason = 'referral'
      AND referred_user_id = NEW.user_id
  ) THEN
    INSERT INTO point_bonuses (user_id, reason, points, referred_user_id)
    VALUES (v_referrer, 'referral', 1, NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prediction_engagement_bonus ON predictions;
CREATE TRIGGER prediction_engagement_bonus
  AFTER INSERT ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION award_engagement_bonuses_on_prediction();

CREATE OR REPLACE FUNCTION claim_share_bonus()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sign in to claim share bonus');
  END IF;

  IF EXISTS (
    SELECT 1 FROM point_bonuses
    WHERE user_id = v_user_id AND reason = 'first_share'
  ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'already_claimed', true,
      'message', 'Share bonus already claimed'
    );
  END IF;

  INSERT INTO point_bonuses (user_id, reason, points)
  VALUES (v_user_id, 'first_share', 1);

  RETURN jsonb_build_object(
    'ok', true,
    'points', 1,
    'message', '+1 pt for sharing the league!'
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'ok', false,
      'already_claimed', true,
      'message', 'Share bonus already claimed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION claim_share_bonus() TO authenticated;

-- Fold engagement bonuses into leaderboard (extends 022 meal-bet totals)
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
    + COALESCE(ebp.engagement_bonus_points, 0)
  )::INTEGER AS total_points,
  COALESCE(SUM(CASE WHEN (pr.points_earned - COALESCE(pr.first_bonus, 0)) = 5 THEN 1 ELSE 0 END), 0)::INTEGER AS exact_scores,
  COALESCE(SUM(COALESCE(pr.first_bonus, 0)), 0)::INTEGER AS early_bonuses,
  COALESCE(sp.points_earned, 0)::INTEGER AS season_bonuses,
  COALESCE(mcp.meal_bet_points, 0)::INTEGER AS meal_bet_points,
  COALESCE(ebp.engagement_bonus_points, 0)::INTEGER AS engagement_bonuses,
  COUNT(pr.id)::INTEGER AS predictions_made,
  MIN(pr.created_at) AS earliest_prediction_at,
  MAX(pr.updated_at) AS last_prediction_at,
  RANK() OVER (
    ORDER BY
      (
        COALESCE(SUM(pr.points_earned), 0)
        + COALESCE(sp.points_earned, 0)
        + COALESCE(mcp.meal_bet_points, 0)
        + COALESCE(ebp.engagement_bonus_points, 0)
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
LEFT JOIN (
  SELECT user_id, SUM(points)::INTEGER AS engagement_bonus_points
  FROM point_bonuses
  GROUP BY user_id
) ebp ON ebp.user_id = p.id
WHERE COALESCE(p.is_admin, false) = false
GROUP BY
  p.id,
  p.display_name,
  p.avatar_url,
  p.created_at,
  sp.points_earned,
  mcp.meal_bet_points,
  ebp.engagement_bonus_points;

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
        + COALESCE(ebp.engagement_bonus_points, 0)
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
            + COALESCE(ebp.engagement_bonus_points, 0)
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
    LEFT JOIN (
      SELECT user_id, SUM(points)::INTEGER AS engagement_bonus_points
      FROM point_bonuses
      GROUP BY user_id
    ) ebp ON ebp.user_id = p.id
    WHERE COALESCE(p.is_admin, false) = false
      AND p.employee_id ~ '^SML [0-9]+$'
    GROUP BY
      p.id,
      p.display_name,
      p.avatar_url,
      p.created_at,
      sp.points_earned,
      mcp.meal_bet_points,
      ebp.engagement_bonus_points
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
