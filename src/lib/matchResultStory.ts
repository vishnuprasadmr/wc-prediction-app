import type { FifaGoalEvent, FifaMatchDetails } from './fifaMatchDetails'
import { buildMatchHero, type MatchHeroShare } from './matchHeroStory'
import { formatStageLabel } from './matchUtils'
import type { Match } from './types'

export interface GoalScorerLine {
  playerName: string
  teamName: string
  minutes: string[]
  goalCount: number
  isPenalty: boolean
}

export interface MatchResultShare {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  stageLabel: string
  winnerLabel: string
  winnerTeam?: string
  isDraw: boolean
  isCleanSheet: boolean
  totalGoals: number
  hero: MatchHeroShare
  scorers: GoalScorerLine[]
}

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ')
}

export function buildGoalScorerLines(goals: FifaGoalEvent[]): GoalScorerLine[] {
  const map = new Map<string, GoalScorerLine>()

  for (const goal of goals) {
    if (goal.isOwnGoal) continue
    const key = goal.playerId || `${goal.playerName}:${goal.teamName}`
    const existing = map.get(key)
    if (!existing) {
      map.set(key, {
        playerName: titleCase(goal.playerName),
        teamName: goal.teamName,
        minutes: [goal.minute.replace(/'/g, '')],
        goalCount: 1,
        isPenalty: goal.isPenalty,
      })
      continue
    }
    existing.goalCount += 1
    existing.minutes.push(goal.minute.replace(/'/g, ''))
    existing.isPenalty = existing.isPenalty || goal.isPenalty
  }

  return [...map.values()].sort((a, b) => b.goalCount - a.goalCount || b.minutes.length - a.minutes.length)
}

function winnerLabel(match: Pick<Match, 'home_team' | 'away_team' | 'home_score' | 'away_score'>): {
  label: string
  team?: string
  isDraw: boolean
} {
  const home = match.home_score ?? 0
  const away = match.away_score ?? 0
  if (home === away) return { label: 'HONOURS EVEN', isDraw: true }
  const team = home > away ? match.home_team : match.away_team
  return { label: `${team.toUpperCase()} WIN`, team, isDraw: false }
}

export function buildMatchResultShare(match: Match, details: FifaMatchDetails | null): MatchResultShare {
  const home = match.home_score ?? 0
  const away = match.away_score ?? 0
  const win = winnerLabel(match)
  const loserScore = win.team === match.home_team ? away : home
  const isCleanSheet = !win.isDraw && loserScore === 0

  return {
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homeScore: home,
    awayScore: away,
    stageLabel: formatStageLabel(match.stage, match.group_name),
    winnerLabel: win.label,
    winnerTeam: win.team,
    isDraw: win.isDraw,
    isCleanSheet,
    totalGoals: home + away,
    hero: buildMatchHero(match, details),
    scorers: details?.goals.length ? buildGoalScorerLines(details.goals) : [],
  }
}
