-- Employee ID on profiles (replaces invite code for registration)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_employee_id_unique
  ON profiles (employee_id)
  WHERE employee_id IS NOT NULL;

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
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id);
  RETURN NEW;
END;
$$;
