-- Run in Supabase SQL editor to enforce 15-minute prediction lock on the server.
-- Example: kickoff 12:30 IST → predictions lock at 12:15 IST.

CREATE OR REPLACE FUNCTION check_prediction_lock()
RETURNS TRIGGER AS $$
DECLARE
  m RECORD;
BEGIN
  SELECT * INTO m FROM matches WHERE id = NEW.match_id;

  IF m.kickoff_at <= now() + interval '15 minutes' OR m.status IN ('live', 'finished') THEN
    RAISE EXCEPTION 'Predictions are locked for this match (15 min before kickoff)';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
