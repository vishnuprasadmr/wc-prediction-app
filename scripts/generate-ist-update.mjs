import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtures = JSON.parse(
  readFileSync(join(__dirname, '../src/data/wc2026-fixtures.json'), 'utf8'),
)

const lines = fixtures.map(
  (f) =>
    `UPDATE matches SET kickoff_at = '${f.kickoff_at}'::timestamptz WHERE api_fixture_id = ${f.api_fixture_id};`,
)

writeFileSync(
  join(__dirname, 'update-match-times-ist.sql'),
  `-- Update all match kickoff times to IST-based schedule\n${lines.join('\n')}\n`,
)
console.log(`Wrote ${fixtures.length} UPDATE statements to update-match-times-ist.sql`)
