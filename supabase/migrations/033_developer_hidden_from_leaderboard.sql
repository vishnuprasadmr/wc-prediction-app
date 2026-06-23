-- Developer account: hidden from public point tables (admins are excluded in leaderboard_view)

UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE lower(email) = lower('castle.jiant@gmail.com') LIMIT 1
);
