-- Developer / non-participant accounts: hidden from public point tables (admins are excluded in leaderboard_view)

UPDATE profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE lower(email) IN (
    lower('castle.jiant@gmail.com'),
    lower('vishnuinfoniz@gmail.com')
  )
);