-- Score sync sets matches to live/finished and recalculate_match_points updates
-- predictions.points_earned. The prediction lock trigger must not block those
-- system recalculations (only user score picks).

CREATE OR REPLACE FUNCTION check_prediction_lock()
RETURNS TRIGGER AS $$
DECLARE
  m RECORD;
BEGIN
  -- System recalc: same home/away pick, only points/bonus changing
  IF TG_OP = 'UPDATE'
     AND NEW.home_pred IS NOT DISTINCT FROM OLD.home_pred
     AND NEW.away_pred IS NOT DISTINCT FROM OLD.away_pred THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  SELECT * INTO m FROM matches WHERE id = NEW.match_id;

  IF m.kickoff_at <= now() + interval '15 minutes' OR m.status IN ('live', 'finished') THEN
    RAISE EXCEPTION 'Predictions are locked for this match (15 min before kickoff)';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
