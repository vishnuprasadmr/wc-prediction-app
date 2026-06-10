-- Additional grants and policies

CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

GRANT SELECT ON leaderboard_view TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_points() TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_by_stage(TEXT) TO authenticated;
