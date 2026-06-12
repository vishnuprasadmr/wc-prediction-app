-- Match comments (one line per user, after full-time only)

CREATE TABLE IF NOT EXISTS match_comments (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL CHECK (char_length(trim(comment)) >= 1 AND char_length(comment) <= 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_comments_match ON match_comments(match_id);

ALTER TABLE match_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS match_comments_select ON match_comments;
DROP POLICY IF EXISTS match_comments_insert ON match_comments;
DROP POLICY IF EXISTS match_comments_update ON match_comments;
DROP POLICY IF EXISTS match_comments_delete ON match_comments;

CREATE POLICY match_comments_select ON match_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY match_comments_insert ON match_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id AND m.status = 'finished'
    )
  );

CREATE POLICY match_comments_update ON match_comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY match_comments_delete ON match_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON match_comments TO authenticated;
