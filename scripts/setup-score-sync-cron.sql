-- Supabase Cron: call sync-scores Edge Function every 15 minutes
-- Run AFTER deploying: supabase functions deploy sync-scores
--
-- Option 1 (easiest): use Dashboard → Integrations → Cron → Create job
-- Option 2: run this SQL in Supabase SQL Editor (replace placeholders)

-- 1. Enable modules (skip if already enabled via Dashboard → Integrations → Cron)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- 2. Store URL + anon key in Vault (run once; replace YOUR_ANON_KEY)
-- select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
-- select vault.create_secret('YOUR_ANON_KEY', 'publishable_key');

-- 3. Schedule the job (every 15 minutes)
-- If re-running, unschedule first: select cron.unschedule('sync-wc-scores');

select cron.schedule(
  'sync-wc-scores',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/sync-scores',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) as request_id;
  $$
);

-- Check scheduled jobs:
-- select * from cron.job;

-- View recent runs:
-- select * from cron.job_run_details order by start_time desc limit 20;

-- Remove schedule:
-- select cron.unschedule('sync-wc-scores');
