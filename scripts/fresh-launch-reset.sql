-- =============================================================================
-- FRESH LAUNCH RESET — Simelabs WC 2026 Prediction App
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor (uses postgres / service role).
--
-- WHAT THIS DOES:
--   ✓ Deletes ALL auth users (email, Google, etc.) and their sessions
--   ✓ Removes all profiles, match predictions, and season questionnaire picks
--   ✓ Clears settled season official results
--   ✓ Resets every match to scheduled (no scores, no live/finished state)
--
-- WHAT THIS KEEPS:
--   ✓ League row (SIMELABS-WC26)
--   ✓ Match fixture schedule (teams, kickoffs, flags)
--   ✓ Schema, functions, views, RLS policies, signup trigger
--
-- AFTER RUNNING:
--   1. Users sign up / sign in again from scratch
--   2. Promote your admin account (see bottom of this file)
--   3. Optional: re-run scripts/full-schedule-sync.sql if kickoff times changed
--
-- ⚠️  IRREVERSIBLE. Take a backup first if unsure:
--     Dashboard → Database → Backups (or Project Settings → Database)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. User gameplay data (explicit clears; auth.user delete also cascades profiles)
-- -----------------------------------------------------------------------------
DELETE FROM predictions;
DELETE FROM season_predictions;
DELETE FROM season_official_results;

-- -----------------------------------------------------------------------------
-- 2. Reset match results — tournament not started yet
-- -----------------------------------------------------------------------------
UPDATE matches
SET
  status = 'scheduled',
  home_score = NULL,
  away_score = NULL,
  score_source = NULL,
  manual_override = false;

-- -----------------------------------------------------------------------------
-- 3. Remove all registered users (cascades profiles → predictions, season picks)
-- -----------------------------------------------------------------------------
DELETE FROM auth.users;

-- -----------------------------------------------------------------------------
-- 4. Ensure default league exists (safe if already present)
-- -----------------------------------------------------------------------------
INSERT INTO leagues (id, name, invite_code)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Simelabs WC 2026',
  'SIMELABS-WC26'
)
ON CONFLICT (invite_code) DO UPDATE SET
  name = EXCLUDED.name;

-- -----------------------------------------------------------------------------
-- 5. Ensure signup trigger is attached (new users get profiles automatically)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, league_id, is_admin, employee_id, questionnaire_completed_at)
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
    false,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'employee_id'), ''),
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    league_id = EXCLUDED.league_id,
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    questionnaire_completed_at = NULL,
    is_admin = EXCLUDED.is_admin;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- -----------------------------------------------------------------------------
-- 6. Verification — all counts should be 0 except matches + 1 league
-- -----------------------------------------------------------------------------
SELECT 'auth.users' AS item, COUNT(*)::TEXT AS count FROM auth.users
UNION ALL SELECT 'profiles', COUNT(*)::TEXT FROM profiles
UNION ALL SELECT 'predictions', COUNT(*)::TEXT FROM predictions
UNION ALL SELECT 'season_predictions', COUNT(*)::TEXT FROM season_predictions
UNION ALL SELECT 'season_official_results', COUNT(*)::TEXT FROM season_official_results
UNION ALL SELECT 'matches (total)', COUNT(*)::TEXT FROM matches
UNION ALL SELECT 'matches (scheduled)', COUNT(*)::TEXT FROM matches WHERE status = 'scheduled'
UNION ALL SELECT 'leagues', COUNT(*)::TEXT FROM leagues;

-- =============================================================================
-- AFTER YOUR FIRST SIGN-IN — promote yourself to admin (run separately):
--
--   UPDATE profiles
--   SET is_admin = true
--   WHERE id = (
--     SELECT id FROM auth.users WHERE email = 'you@example.com' LIMIT 1
--   );
--
-- Or by display name:
--
--   UPDATE profiles SET is_admin = true WHERE display_name = 'Your Name';
-- =============================================================================
