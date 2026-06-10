import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtures = JSON.parse(
  readFileSync(join(__dirname, '../src/data/wc2026-fixtures.json'), 'utf8'),
)

const lines = fixtures.map((f) => {
  const group = f.group_name ? `'${f.group_name}'` : 'NULL'
  return `SELECT seed_match(${f.api_fixture_id}, '${f.stage}', ${group}, '${f.home_team.replace(/'/g, "''")}', '${f.away_team.replace(/'/g, "''")}', '${f.home_flag}', '${f.away_flag}', '${f.kickoff_at}'::timestamptz);`
})

const sql = `-- Auto-generated fixture seed
CREATE OR REPLACE FUNCTION seed_match(
  p_api_id INTEGER,
  p_stage TEXT,
  p_group TEXT,
  p_home TEXT,
  p_away TEXT,
  p_home_flag TEXT,
  p_away_flag TEXT,
  p_kickoff TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
  VALUES (p_api_id, p_stage, p_group, p_home, p_away, p_home_flag, p_away_flag, p_kickoff, 'scheduled')
  ON CONFLICT (api_fixture_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

${lines.join('\n')}
`

writeFileSync(join(__dirname, '../supabase/migrations/002_seed_fixtures.sql'), sql)
console.log(`Seeded ${fixtures.length} fixtures into migration`)
