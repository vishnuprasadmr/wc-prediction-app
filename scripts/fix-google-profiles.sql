-- Run in Supabase SQL Editor if Google users exist in auth.users but have no profiles row.
-- Also ensures signup trigger + insert policy are in place for new OAuth users.

INSERT INTO leagues (id, name, invite_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'Simelabs WC 2026', 'SIMELABS-WC26')
ON CONFLICT (invite_code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, league_id, is_admin)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'league_id')::UUID,
      '00000000-0000-0000-0000-000000000001'::UUID
    ),
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    league_id = EXCLUDED.league_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Backfill profiles for Google (or any) auth users missing a row
INSERT INTO public.profiles (id, display_name, league_id, is_admin)
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
  false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
