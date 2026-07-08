-- One vote only: drop player UPDATE on season_edit_poll_votes (if 036 already applied with UPDATE)

DROP POLICY IF EXISTS season_edit_poll_votes_update ON season_edit_poll_votes;

REVOKE UPDATE ON season_edit_poll_votes FROM authenticated;
GRANT INSERT ON season_edit_poll_votes TO authenticated;
