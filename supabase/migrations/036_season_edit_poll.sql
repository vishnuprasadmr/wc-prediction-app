-- Season picks re-edit poll (before Quarter-finals)
-- Admin opens voting → players vote yes/no → admin publishes results
-- Optionally opens a one-time re-edit window until first QF kickoff

CREATE TABLE IF NOT EXISTS season_edit_poll (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  status TEXT NOT NULL DEFAULT 'closed'
    CHECK (status IN ('closed', 'open', 'published')),
  question TEXT NOT NULL DEFAULT
    'Want a chance to edit your Golden Boot, winner, dark horse & other season picks before the Quarter-finals?',
  edit_window_open BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  edit_opened_at TIMESTAMPTZ,
  edit_closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS season_edit_poll_votes (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO season_edit_poll (id, status)
VALUES (true, 'closed')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE season_edit_poll ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_edit_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS season_edit_poll_select ON season_edit_poll;
DROP POLICY IF EXISTS season_edit_poll_admin_write ON season_edit_poll;
DROP POLICY IF EXISTS season_edit_poll_votes_select ON season_edit_poll_votes;
DROP POLICY IF EXISTS season_edit_poll_votes_insert ON season_edit_poll_votes;
DROP POLICY IF EXISTS season_edit_poll_votes_update ON season_edit_poll_votes;

-- Everyone can read poll config (needed for vote UI + published reveal)
CREATE POLICY season_edit_poll_select ON season_edit_poll
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY season_edit_poll_admin_write ON season_edit_poll
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Votes visible to all authenticated (for live tallies + published reveal)
CREATE POLICY season_edit_poll_votes_select ON season_edit_poll_votes
  FOR SELECT TO authenticated
  USING (true);

-- Insert only — one vote per user (PK on user_id); no UPDATE so votes cannot be changed
CREATE POLICY season_edit_poll_votes_insert ON season_edit_poll_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM season_edit_poll WHERE id = true AND status = 'open')
  );

GRANT SELECT ON season_edit_poll TO authenticated;
GRANT SELECT ON season_edit_poll_votes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON season_edit_poll TO authenticated;
GRANT INSERT ON season_edit_poll_votes TO authenticated;
