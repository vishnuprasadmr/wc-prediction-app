import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtures = JSON.parse(
  readFileSync(join(__dirname, '../src/data/wc2026-fixtures.json'), 'utf8'),
)

const esc = (s) => s.replace(/'/g, "''")

const upserts = fixtures.map((f) => {
  const group = f.group_name ? `'${f.group_name}'` : 'NULL'
  return `INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (${f.api_fixture_id}, '${f.stage}', ${group}, '${esc(f.home_team)}', '${esc(f.away_team)}', '${f.home_flag}', '${f.away_flag}', '${f.kickoff_at}'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;`
})

const cleanup = `-- Remove legacy placeholder knockouts (old seed used api_fixture_ids 3001-3006)
DELETE FROM matches WHERE api_fixture_id BETWEEN 3001 AND 3006;

-- Remove duplicate knockout rows outside official FIFA match numbers (2000-2103)
DELETE FROM matches
WHERE stage IN ('Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third place', 'Final')
  AND (api_fixture_id IS NULL OR api_fixture_id < 2000 OR api_fixture_id > 2103);

-- Ensure only one Final (official match #104 → api_fixture_id 2103)
DELETE FROM matches WHERE stage = 'Final' AND api_fixture_id <> 2103;

-- Ensure only one Third place match (#103 → api_fixture_id 2102)
DELETE FROM matches WHERE stage = 'Third place' AND api_fixture_id <> 2102;
`

const sql = `-- Full official FIFA World Cup 2026 schedule sync (104 matches, IST-accurate kickoffs)
-- Run in Supabase SQL Editor

${cleanup}

${upserts.join('\n\n')}

SELECT COUNT(*) AS total_matches FROM matches;
SELECT stage, COUNT(*) FROM matches WHERE stage = 'Final' GROUP BY stage;
`

writeFileSync(join(__dirname, 'full-schedule-sync.sql'), sql)
console.log(`Wrote full-schedule-sync.sql (${fixtures.length} matches)`)
