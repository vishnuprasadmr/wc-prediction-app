import type { Match } from './types'

export interface GroupTeamRow {
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

export interface GroupStandings {
  group: string
  teams: GroupTeamRow[]
  matches: Match[]
}

const GROUP_LETTERS = 'ABCDEFGHIJKL'.split('')

function emptyRow(team: string): GroupTeamRow {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }
}

function applyResult(
  rows: Map<string, GroupTeamRow>,
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
) {
  const homeRow = rows.get(home) ?? emptyRow(home)
  const awayRow = rows.get(away) ?? emptyRow(away)

  homeRow.played += 1
  awayRow.played += 1
  homeRow.goalsFor += homeScore
  homeRow.goalsAgainst += awayScore
  awayRow.goalsFor += awayScore
  awayRow.goalsAgainst += homeScore

  if (homeScore > awayScore) {
    homeRow.won += 1
    homeRow.points += 3
    awayRow.lost += 1
  } else if (homeScore < awayScore) {
    awayRow.won += 1
    awayRow.points += 3
    homeRow.lost += 1
  } else {
    homeRow.drawn += 1
    awayRow.drawn += 1
    homeRow.points += 1
    awayRow.points += 1
  }

  homeRow.goalDiff = homeRow.goalsFor - homeRow.goalsAgainst
  awayRow.goalDiff = awayRow.goalsFor - awayRow.goalsAgainst

  rows.set(home, homeRow)
  rows.set(away, awayRow)
}

function sortTeams(a: GroupTeamRow, b: GroupTeamRow): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
  return a.team.localeCompare(b.team)
}

/** Build group tables from finished first-stage matches. */
export function buildGroupStandings(matches: Match[]): GroupStandings[] {
  const byGroup = new Map<string, { rows: Map<string, GroupTeamRow>; matches: Match[] }>()

  for (const match of matches) {
    if (match.stage !== 'Group' || !match.group_name) continue
    if (match.status !== 'finished') continue
    if (match.home_score === null || match.away_score === null) continue

    const group = match.group_name
    if (!byGroup.has(group)) {
      byGroup.set(group, { rows: new Map(), matches: [] })
    }
    const bucket = byGroup.get(group)!
    bucket.matches.push(match)
    applyResult(bucket.rows, match.home_team, match.away_team, match.home_score, match.away_score)
  }

  const groups = [...byGroup.keys()].sort((a, b) => a.localeCompare(b))

  return groups.map((group) => {
    const bucket = byGroup.get(group)!
    const teams = [...bucket.rows.values()].sort(sortTeams)
    bucket.matches.sort(
      (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    )
    return { group, teams, matches: bucket.matches }
  })
}

export function listGroupLetters(matches: Match[]): string[] {
  const fromData = new Set(
    matches.filter((m) => m.stage === 'Group' && m.group_name).map((m) => m.group_name!),
  )
  return GROUP_LETTERS.filter((g) => fromData.has(g))
}
