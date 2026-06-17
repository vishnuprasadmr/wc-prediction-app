-- Community meal challenges: user proposes a food stake, admin approves, winner gets the meal

CREATE TYPE meal_challenge_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'settled',
  'cancelled'
);

CREATE TYPE meal_challenge_win_condition AS ENUM (
  'exact_score',
  'correct_result',
  'correct_winner'
);

CREATE TABLE meal_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL CHECK (char_length(trim(claim_text)) >= 4),
  stake_text TEXT NOT NULL CHECK (char_length(trim(stake_text)) >= 4),
  win_condition meal_challenge_win_condition NOT NULL DEFAULT 'exact_score',
  status meal_challenge_status NOT NULL DEFAULT 'pending',
  reject_reason TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  winner_user_id UUID REFERENCES profiles(id),
  winner_note TEXT,
  settled_at TIMESTAMPTZ,
  settled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_challenges_match ON meal_challenges(match_id);
CREATE INDEX idx_meal_challenges_status ON meal_challenges(status);
CREATE INDEX idx_meal_challenges_creator ON meal_challenges(creator_id);

ALTER TABLE meal_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meal_challenges_select ON meal_challenges;
DROP POLICY IF EXISTS meal_challenges_insert ON meal_challenges;
DROP POLICY IF EXISTS meal_challenges_admin_update ON meal_challenges;

CREATE POLICY meal_challenges_select ON meal_challenges
  FOR SELECT TO authenticated
  USING (
    status IN ('approved', 'settled')
    OR creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY meal_challenges_insert ON meal_challenges
  FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND status = 'pending'
  );

CREATE POLICY meal_challenges_admin_update ON meal_challenges
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

GRANT SELECT, INSERT ON meal_challenges TO authenticated;
GRANT UPDATE ON meal_challenges TO authenticated;

-- Creator can cancel own pending challenge
DROP POLICY IF EXISTS meal_challenges_creator_cancel ON meal_challenges;
CREATE POLICY meal_challenges_creator_cancel ON meal_challenges
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid() AND status = 'pending')
  WITH CHECK (creator_id = auth.uid() AND status = 'cancelled');
