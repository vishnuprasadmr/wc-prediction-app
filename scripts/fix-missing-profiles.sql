-- Backfill profiles for auth users missing a row (fixes season_predictions FK 23503)
-- Run in Supabase SQL Editor after migrations 006 + 007

INSERT INTO leagues (id, name, invite_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'Simelabs WC 2026', 'SIMELABS-WC26')
ON CONFLICT (invite_code) DO NOTHING;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_employee_id_unique
  ON profiles (employee_id)
  WHERE employee_id IS NOT NULL;

INSERT INTO public.profiles (id, display_name, league_id, is_admin, employee_id)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1),
    'Player'
  ),
  '00000000-0000-0000-0000-000000000001'::UUID,
  false,
  NULLIF(TRIM(u.raw_user_meta_data->>'employee_id'), '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Users still missing profiles (no metadata) must re-register with SML ID
SELECT
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'employee_id' AS employee_id_meta
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
