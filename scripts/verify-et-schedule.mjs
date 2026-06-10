/**
 * Verify app fixtures against Economic Times IST schedule (article 131624389)
 * ET rows: [matchNo, istDate 'YYYY-MM-DD', istTime 'HH:MM' 24h, home, away, venueAlias]
 */
import { OFFICIAL_MATCHES, parseDate, localKickoffToIso } from './official-schedule-data.mjs'

const APP_TIMEZONE = 'Asia/Kolkata'

const VENUE_ALIAS = {
  'Mexico City': 'Mexico City',
  'Guadalajara': 'Zapopan',
  'Toronto': 'Toronto',
  'Los Angeles': 'Los Angeles',
  'San Francisco Bay Area': 'Santa Clara',
  'New York/New Jersey': 'New Jersey',
  'Boston': 'Foxborough',
  'Vancouver': 'Vancouver',
  'Houston': 'Houston',
  'Philadelphia': 'Philadelphia',
  'Dallas': 'Arlington',
  'Monterrey': 'Guadalajara',
  'Miami': 'Miami',
  'Atlanta': 'Atlanta',
  'Seattle': 'Seattle',
  'Kansas City': 'Kansas City',
}

const TEAM_ALIAS = {
  'Türkiye': 'Turkey',
  'Congo DR': 'DR Congo',
}

// Parsed from ET article table (IST date + time + fixtures)
const ET_SCHEDULE = [
  [1, '2026-06-12', '00:30', 'Mexico', 'South Africa', 'Mexico City'],
  [2, '2026-06-12', '07:30', 'South Korea', 'Czechia', 'Zapopan'],
  [3, '2026-06-13', '00:30', 'Canada', 'Bosnia and Herzegovina', 'Toronto'],
  [4, '2026-06-13', '06:30', 'USA', 'Paraguay', 'Los Angeles'],
  [5, '2026-06-14', '00:30', 'Qatar', 'Switzerland', 'Santa Clara'],
  [6, '2026-06-14', '03:30', 'Brazil', 'Morocco', 'New Jersey'],
  [7, '2026-06-14', '06:30', 'Haiti', 'Scotland', 'Foxborough'],
  [8, '2026-06-14', '09:30', 'Australia', 'Turkey', 'Vancouver'],
  [9, '2026-06-14', '22:30', 'Germany', 'Curaçao', 'Houston'],
  [10, '2026-06-15', '01:30', 'Netherlands', 'Japan', 'Arlington'],
  [11, '2026-06-15', '04:30', 'Ivory Coast', 'Ecuador', 'Philadelphia'],
  [12, '2026-06-15', '07:30', 'Sweden', 'Tunisia', 'Guadalajara'],
  [13, '2026-06-15', '21:30', 'Spain', 'Cape Verde', 'Atlanta'],
  [14, '2026-06-16', '00:30', 'Belgium', 'Egypt', 'Seattle'],
  [15, '2026-06-16', '03:30', 'Saudi Arabia', 'Uruguay', 'Miami'],
  [16, '2026-06-16', '06:30', 'Iran', 'New Zealand', 'Los Angeles'],
  [17, '2026-06-17', '00:30', 'France', 'Senegal', 'New Jersey'],
  [18, '2026-06-17', '03:30', 'Iraq', 'Norway', 'Foxborough'],
  [19, '2026-06-17', '06:30', 'Argentina', 'Algeria', 'Kansas City'],
  [20, '2026-06-17', '09:30', 'Austria', 'Jordan', 'Santa Clara'],
  [21, '2026-06-17', '22:30', 'Portugal', 'DR Congo', 'Houston'],
  [22, '2026-06-18', '01:30', 'England', 'Croatia', 'Arlington'],
  [23, '2026-06-18', '04:30', 'Ghana', 'Panama', 'Toronto'],
  [24, '2026-06-18', '07:30', 'Uzbekistan', 'Colombia', 'Mexico City'],
  [25, '2026-06-18', '21:30', 'Czechia', 'South Africa', 'Atlanta'],
  [26, '2026-06-19', '00:30', 'Switzerland', 'Bosnia and Herzegovina', 'Los Angeles'],
  [27, '2026-06-19', '03:30', 'Canada', 'Qatar', 'Vancouver'],
  [28, '2026-06-19', '06:30', 'Mexico', 'South Korea', 'Zapopan'],
  [29, '2026-06-20', '00:30', 'USA', 'Australia', 'Seattle'],
  [30, '2026-06-20', '03:30', 'Scotland', 'Morocco', 'Foxborough'],
  [31, '2026-06-20', '06:00', 'Brazil', 'Haiti', 'Philadelphia'],
  [32, '2026-06-20', '08:30', 'Turkey', 'Paraguay', 'Santa Clara'],
  [33, '2026-06-20', '22:30', 'Netherlands', 'Sweden', 'Houston'],
  [34, '2026-06-21', '01:30', 'Germany', 'Ivory Coast', 'Toronto'],
  [35, '2026-06-21', '05:30', 'Ecuador', 'Curaçao', 'Kansas City'],
  [36, '2026-06-21', '09:30', 'Tunisia', 'Japan', 'Guadalajara'],
  [37, '2026-06-21', '21:30', 'Spain', 'Saudi Arabia', 'Atlanta'],
  [38, '2026-06-22', '00:30', 'Belgium', 'Iran', 'Los Angeles'],
  [39, '2026-06-22', '03:30', 'Uruguay', 'Cape Verde', 'Miami'],
  [40, '2026-06-22', '06:30', 'New Zealand', 'Egypt', 'Vancouver'],
  [41, '2026-06-22', '22:30', 'Argentina', 'Austria', 'Arlington'],
  [42, '2026-06-23', '02:30', 'France', 'Iraq', 'Philadelphia'],
  [43, '2026-06-23', '05:30', 'Norway', 'Senegal', 'Toronto'],
  [44, '2026-06-23', '08:30', 'Jordan', 'Algeria', 'Santa Clara'],
  [45, '2026-06-23', '22:30', 'Portugal', 'Uzbekistan', 'Houston'],
  [46, '2026-06-24', '01:30', 'England', 'Ghana', 'Foxborough'],
  [47, '2026-06-24', '04:30', 'Panama', 'Croatia', 'Foxborough'],
  [48, '2026-06-24', '07:30', 'Colombia', 'DR Congo', 'Zapopan'],
  [49, '2026-06-25', '00:30', 'Switzerland', 'Canada', 'Vancouver'],
  [50, '2026-06-25', '00:30', 'Bosnia and Herzegovina', 'Qatar', 'Seattle'],
  [51, '2026-06-25', '03:30', 'Morocco', 'Haiti', 'Atlanta'],
  [52, '2026-06-25', '03:30', 'Scotland', 'Brazil', 'Miami'],
  [53, '2026-06-25', '06:30', 'South Africa', 'South Korea', 'Guadalajara'],
  [54, '2026-06-25', '06:30', 'Czechia', 'Mexico', 'Mexico City'],
  [55, '2026-06-26', '01:30', 'Curaçao', 'Ivory Coast', 'Philadelphia'],
  [56, '2026-06-26', '01:30', 'Ecuador', 'Germany', 'New Jersey'],
  [57, '2026-06-26', '04:30', 'Tunisia', 'Netherlands', 'Kansas City'],
  [58, '2026-06-26', '04:30', 'Japan', 'Sweden', 'Arlington'],
  [59, '2026-06-26', '07:30', 'Turkey', 'USA', 'Los Angeles'],
  [60, '2026-06-26', '07:30', 'Paraguay', 'Australia', 'Santa Clara'],
  [61, '2026-06-27', '00:30', 'Norway', 'France', 'Foxborough'],
  [62, '2026-06-27', '00:30', 'Senegal', 'Iraq', 'Toronto'],
  [63, '2026-06-27', '05:30', 'Cape Verde', 'Saudi Arabia', 'Houston'],
  [64, '2026-06-27', '05:30', 'Uruguay', 'Spain', 'Zapopan'],
  [65, '2026-06-27', '08:30', 'New Zealand', 'Belgium', 'Vancouver'],
  [66, '2026-06-27', '08:30', 'Egypt', 'Iran', 'Seattle'],
  [67, '2026-06-28', '02:30', 'Panama', 'England', 'New Jersey'],
  [68, '2026-06-28', '02:30', 'Croatia', 'Ghana', 'Philadelphia'],
  [69, '2026-06-28', '05:00', 'Colombia', 'Portugal', 'Miami'],
  [70, '2026-06-28', '05:00', 'DR Congo', 'Uzbekistan', 'Atlanta'],
  [71, '2026-06-28', '07:30', 'Algeria', 'Austria', 'Kansas City'],
  [72, '2026-06-28', '07:30', 'Jordan', 'Argentina', 'Arlington'],
  [73, '2026-06-29', '00:30', 'TBD', 'TBD', 'Los Angeles'],
  [74, '2026-06-29', '22:30', 'TBD', 'TBD', 'Houston'],
  [75, '2026-06-30', '02:00', 'TBD', 'TBD', 'Foxborough'],
  [76, '2026-06-30', '06:30', 'TBD', 'TBD', 'Guadalajara'],
  [77, '2026-06-30', '22:30', 'TBD', 'TBD', 'Arlington'],
  [78, '2026-07-01', '02:30', 'TBD', 'TBD', 'New Jersey'],
  [79, '2026-07-01', '06:30', 'TBD', 'TBD', 'Mexico City'],
  [80, '2026-07-01', '21:30', 'TBD', 'TBD', 'Atlanta'],
  [81, '2026-07-02', '01:30', 'TBD', 'TBD', 'Seattle'],
  [82, '2026-07-02', '01:30', 'TBD', 'TBD', 'Santa Clara'],
  [83, '2026-07-02', '05:30', 'TBD', 'TBD', 'Los Angeles'],
  [84, '2026-07-03', '00:30', 'TBD', 'TBD', 'Toronto'],
  [85, '2026-07-03', '04:30', 'TBD', 'TBD', 'Vancouver'],
  [86, '2026-07-03', '08:30', 'TBD', 'TBD', 'Arlington'],
  [87, '2026-07-03', '23:30', 'TBD', 'TBD', 'Miami'],
  [88, '2026-07-04', '03:30', 'TBD', 'TBD', 'Kansas City'],
  [89, '2026-07-04', '07:00', 'TBD', 'TBD', 'Houston'],
  [90, '2026-07-04', '22:30', 'TBD', 'TBD', 'Philadelphia'],
  [91, '2026-07-05', '02:30', 'TBD', 'TBD', 'New Jersey'],
  [92, '2026-07-06', '01:30', 'TBD', 'TBD', 'Mexico City'],
  [93, '2026-07-06', '05:30', 'TBD', 'TBD', 'Arlington'],
  [94, '2026-07-07', '01:30', 'TBD', 'TBD', 'Seattle'],
  [95, '2026-07-07', '21:30', 'TBD', 'TBD', 'Atlanta'],
  [96, '2026-07-08', '01:30', 'TBD', 'TBD', 'Vancouver'],
  [97, '2026-07-10', '01:30', 'TBD', 'TBD', 'Foxborough'],
  [98, '2026-07-11', '00:30', 'TBD', 'TBD', 'Los Angeles'],
  [99, '2026-07-12', '02:30', 'TBD', 'TBD', 'Miami'],
  [100, '2026-07-12', '06:30', 'TBD', 'TBD', 'Kansas City'],
  [101, '2026-07-15', '00:30', 'TBD', 'TBD', 'Arlington'],
  [102, '2026-07-16', '00:30', 'TBD', 'TBD', 'Atlanta'],
  [103, '2026-07-19', '02:30', 'TBD', 'TBD', 'Miami'],
  [104, '2026-07-20', '00:30', 'TBD', 'TBD', 'New Jersey'],
]

function normTeam(t) {
  return TEAM_ALIAS[t] ?? t
}

function toIstParts(iso) {
  const d = new Date(iso)
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(d)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00'
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00'
  return { date, time: `${hour}:${minute}` }
}

const appFixtures = OFFICIAL_MATCHES.map(([matchNo, date, time, home, away, , , city]) => ({
  matchNo,
  home: normTeam(home),
  away: normTeam(away),
  city,
  venueAlias: VENUE_ALIAS[city] ?? city,
  kickoff_at: localKickoffToIso(parseDate(date), time, city),
}))

function teamKey(home, away) {
  return [normTeam(home), normTeam(away)].sort().join('|')
}

const appByTeams = new Map(
  appFixtures.map((f) => [teamKey(f.home, f.away), f]),
)

let timeMismatches = []
let numberMismatches = []
let missing = []
let ok = 0

for (const et of ET_SCHEDULE) {
  const [matchNo, etDate, etTime, etHome, etAway, etVenue] = et
  const app =
    etHome === 'TBD'
      ? appFixtures.find((f) => f.matchNo === matchNo)
      : appByTeams.get(teamKey(etHome, etAway))
  if (!app) {
    missing.push({ matchNo, etHome, etAway })
    continue
  }
  const ist = toIstParts(app.kickoff_at)
  const issues = []
  if (ist.date !== etDate || ist.time !== etTime) {
    issues.push(`time: app ${ist.date} ${ist.time} vs ET ${etDate} ${etTime}`)
  }
  const venueOk =
    app.venueAlias === etVenue ||
    (etVenue === 'Guadalajara' && app.city === 'Guadalajara') ||
    (etVenue === 'Zapopan' && app.city === 'Guadalajara')
  if (!venueOk) {
    issues.push(`venue: app ${app.venueAlias} (${app.city}) vs ET ${etVenue}`)
  }
  if (app.matchNo !== matchNo) {
    numberMismatches.push({
      matchNo,
      appMatchNo: app.matchNo,
      fixture: `${etHome} vs ${etAway}`,
    })
  }
  if (issues.length) timeMismatches.push({ matchNo, fixture: `${etHome} vs ${etAway}`, issues })
  else ok++
}

console.log(`IST time+venue match: ${ok}/104`)
console.log(`FIFA match number mismatches: ${numberMismatches.length}/104`)

if (numberMismatches.length) {
  console.log('\nMatch number drift (times still OK for these):')
  for (const m of numberMismatches.slice(0, 10)) {
    console.log(`  ET #${m.matchNo} = app #${m.appMatchNo}: ${m.fixture}`)
  }
  if (numberMismatches.length > 10) console.log(`  ... and ${numberMismatches.length - 10} more`)
}

if (missing.length) {
  console.log(`\nMissing fixtures: ${missing.length}`)
  for (const m of missing) console.log(`  ET #${m.matchNo}: ${m.etHome} vs ${m.etAway}`)
}

if (timeMismatches.length) {
  console.log(`\n${timeMismatches.length} real IST/time/venue mismatches:\n`)
  for (const m of timeMismatches) {
    console.log(`ET #${m.matchNo} ${m.fixture}: ${m.issues.join('; ')}`)
  }
  process.exit(1)
}

if (missing.length) process.exit(1)
console.log('\nAll 104 fixtures align with ET on IST kickoff times and venues.')
