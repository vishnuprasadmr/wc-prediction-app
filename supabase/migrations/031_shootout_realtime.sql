-- Enable Supabase Realtime for Arena turn updates (postgres_changes)

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shootout_challenges;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shootout_kicks;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
