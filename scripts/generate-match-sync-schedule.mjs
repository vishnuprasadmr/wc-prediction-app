/**
 * Generates SQL cron jobs to call sync-scores after each match ends.
 *
 * For each fixture:
 *   - FT sync  : kickoff + 2h 10m (buffer for full time)
 *   - Retry    : kickoff + 3h 00m (extra time / late FIFA update)
 *
 * Usage:
 *   node scripts/generate-match-sync-schedule.mjs > scripts/match-sync-schedule.sql
 *
 * Then in Supabase SQL Editor:
 *   1. Enable Cron (Integrations → Cron)
 *   2. Store vault secrets (project_url, publishable_key) — see setup-score-sync-cron.sql
 *   3. Run scripts/match-sync-schedule.sql
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/wc2026-fixtures.json'), 'utf8'),
)

const FT_BUFFER_MIN = 130 // kickoff + 2h10m
const RETRY_BUFFER_MIN = 180 // kickoff + 3h

function toCron(iso, addMinutes) {
  const d = new Date(new Date(iso).getTime() + addMinutes * 60 * 1000)
  const min = d.getUTCMinutes()
  const hour = d.getUTCHours()
  const day = d.getUTCDate()
  const month = d.getUTCMonth() + 1
  return `${min} ${hour} ${day} ${month} *`
}

const lines = [
  '-- Auto-generated match-end sync cron jobs for WC 2026',
  '-- Run AFTER: supabase functions deploy sync-scores',
  '-- Requires vault secrets: project_url, publishable_key (see setup-score-sync-cron.sql)',
  '',
  "create extension if not exists pg_cron with schema pg_catalog;",
  "create extension if not exists pg_net with schema extensions;",
  '',
  '-- Optional: remove old jobs if re-generating',
  '-- select cron.unschedule(jobname) from cron.job where jobname like \'sync-match-%\';',
  '',
]

for (const f of fixtures) {
  const n = String(f.match_number).padStart(3, '0')
  const body = JSON.stringify({ matchNumber: f.match_number })

  for (const [suffix, mins] of [
    ['ft', FT_BUFFER_MIN],
    ['retry', RETRY_BUFFER_MIN],
  ]) {
    const cron = toCron(f.kickoff_at, mins)
    const job = `sync-match-${n}-${suffix}`
    lines.push(`-- Match ${f.match_number}: ${f.home_team} vs ${f.away_team} (${suffix})`)
    lines.push(`select cron.schedule(`)
    lines.push(`  '${job}',`)
    lines.push(`  '${cron}',`)
    lines.push(`  $$`)
    lines.push(`  select net.http_post(`)
    lines.push(
      `    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')`,
    )
    lines.push(`         || '/functions/v1/sync-scores',`)
    lines.push(`    headers := jsonb_build_object(`)
    lines.push(`      'Content-Type', 'application/json',`)
    lines.push(
      `      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')`,
    )
    lines.push(`    ),`)
    lines.push(`    body := '${body}'::jsonb,`)
    lines.push(`    timeout_milliseconds := 60000`)
    lines.push(`  ) as request_id;`)
    lines.push(`  $$`)
    lines.push(`);`)
    lines.push('')
  }
}

// Fallback: every 15 min during tournament, sync any match that has kicked off
lines.push('-- Fallback: catch any missed updates (Jun 11 – Jul 20, 2026 UTC)')
lines.push(`select cron.schedule(`)
lines.push(`  'sync-scores-due-fallback',`)
lines.push(`  '*/15 * * * *',`)
lines.push(`  $$`)
lines.push(`  select net.http_post(`)
lines.push(
  `    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')`,
)
lines.push(`         || '/functions/v1/sync-scores',`)
lines.push(`    headers := jsonb_build_object(`)
lines.push(`      'Content-Type', 'application/json',`)
lines.push(
  `      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')`,
)
lines.push(`    ),`)
lines.push(`    body := '{"dueOnly":true}'::jsonb,`)
lines.push(`    timeout_milliseconds := 60000`)
lines.push(`  ) as request_id;`)
lines.push(`  $$`)
lines.push(`);`)

console.log(lines.join('\n'))
