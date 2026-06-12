-- Track when a user skips the pre-tournament questionnaire (can complete later from Profile)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS questionnaire_skipped_at TIMESTAMPTZ;
