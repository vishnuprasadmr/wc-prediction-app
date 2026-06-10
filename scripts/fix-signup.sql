-- Run this in Supabase SQL Editor if signup shows "Database error saving new user"

-- 1. Ensure the Simelabs league exists
INSERT INTO leagues (id, name, invite_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'Simelabs WC 2026', 'SIMELABS-WC26')
ON CONFLICT (invite_code) DO NOTHING;

-- 2. Fix the signup trigger (search_path + default league_id)
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
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
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

-- 3. Allow users to insert their own profile (fallback if trigger misses)
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Re-attach trigger in case it was missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
