import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import {
  OFFICIAL_MATCHES,
  TEAM_FLAGS,
  parseDate,
  localKickoffToIso,
} from './official-schedule-data.mjs'

const fixtures = OFFICIAL_MATCHES.map(([matchNo, date, time, home, away, group, stage, city]) => {
  const dateStr = parseDate(date)
  return {
    api_fixture_id: 1999 + matchNo,
    stage,
    group_name: group,
    home_team: home,
    away_team: away,
    home_flag: TEAM_FLAGS[home] ?? '🏳️',
    away_flag: TEAM_FLAGS[away] ?? '🏳️',
    kickoff_at: localKickoffToIso(dateStr, time, city),
    status: 'scheduled',
    match_number: matchNo,
    venue_city: city,
  }
})

const __dirname = dirname(fileURLToPath(import.meta.url))
writeFileSync(
  join(__dirname, '../src/data/wc2026-fixtures.json'),
  JSON.stringify(fixtures, null, 2),
)

// Verify opening match
const opener = fixtures.find((f) => f.match_number === 1)
const ist = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'full',
  timeStyle: 'short',
}).format(new Date(opener.kickoff_at))

console.log(`Generated ${fixtures.length} official FIFA fixtures`)
console.log(`Opening: ${opener.home_team} vs ${opener.away_team} → ${ist}`)
