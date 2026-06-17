import { getTeamSquad } from '../data/teamSquads'
import type { FifaGoalEvent, FifaMatchDetails } from './fifaMatchDetails'
import type { Match } from './types'

export interface MatchHeroShare {
  playerName: string
  teamName: string
  pictureUrl?: string
  headline: string
  subline: string
  goalCount: number
  lastMinute?: string
  /** Team used for flag fallback when no player photo */
  backdropTeam?: string
}

function titleCaseName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function displayPlayerName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 1]!.toUpperCase()) {
    return `${parts.slice(0, -1).join(' ')} ${titleCaseName(parts[parts.length - 1]!)}`
  }
  return titleCaseName(name)
}

function isLateMinute(minuteSort: number, minute: string): boolean {
  return minuteSort >= 85 || minute.includes('+')
}

function pickSpotlightPlayer(goals: FifaGoalEvent[]): {
  playerId: string
  playerName: string
  teamName: string
  goalCount: number
  lastMinute: string
  lastMinuteSort: number
  hasPenalty: boolean
} | null {
  const byPlayer = new Map<
    string,
    {
      playerId: string
      playerName: string
      teamName: string
      goalCount: number
      lastMinute: string
      lastMinuteSort: number
      hasPenalty: boolean
    }
  >()

  for (const goal of goals) {
    if (goal.isOwnGoal) continue
    const key = goal.playerId || `${goal.playerName}:${goal.teamName}`
    const existing = byPlayer.get(key)
    if (!existing) {
      byPlayer.set(key, {
        playerId: goal.playerId,
        playerName: goal.playerName,
        teamName: goal.teamName,
        goalCount: 1,
        lastMinute: goal.minute,
        lastMinuteSort: goal.minuteSort,
        hasPenalty: goal.isPenalty,
      })
      continue
    }
    existing.goalCount += 1
    if (goal.minuteSort >= existing.lastMinuteSort) {
      existing.lastMinute = goal.minute
      existing.lastMinuteSort = goal.minuteSort
    }
    existing.hasPenalty = existing.hasPenalty || goal.isPenalty
  }

  const ranked = [...byPlayer.values()].sort((a, b) => {
    if (b.goalCount !== a.goalCount) return b.goalCount - a.goalCount
    return b.lastMinuteSort - a.lastMinuteSort
  })

  return ranked[0] ?? null
}

function scorelineSubline(match: Pick<Match, 'home_team' | 'away_team' | 'home_score' | 'away_score'>): string {
  const home = match.home_score ?? 0
  const away = match.away_score ?? 0
  return `${match.home_team} ${home}–${away} ${match.away_team}`
}

function winningTeam(match: Pick<Match, 'home_team' | 'away_team' | 'home_score' | 'away_score'>): string | null {
  const home = match.home_score ?? 0
  const away = match.away_score ?? 0
  if (home === away) return null
  return home > away ? match.home_team : match.away_team
}

function squadSpotlightPlayer(team: string): { name: string; teamName: string } | null {
  const squad = getTeamSquad(team)
  const forward = squad.players.find((p) => p.role === 'FWD') ?? squad.players.at(-1)
  if (!forward) return null
  return { name: forward.name, teamName: team }
}

function buildGoalHeadline(
  playerName: string,
  goalCount: number,
  lastMinute: string,
  lastMinuteSort: number,
  hasPenalty: boolean,
): string {
  const name = displayPlayerName(playerName)
  if (goalCount >= 3) return `${name} with a hat-trick!`
  if (goalCount === 2) return `${name} with a brace`
  if (hasPenalty) return `${name} from the spot`
  if (isLateMinute(lastMinuteSort, lastMinute)) {
    return `${name} scored in the ${lastMinute.replace(/'/g, '')}`
  }
  return `${name} got on the scoresheet`
}

export function buildMatchHeroFromGoals(
  match: Pick<Match, 'home_team' | 'away_team' | 'home_score' | 'away_score'>,
  details: FifaMatchDetails,
): MatchHeroShare | null {
  const spotlight = pickSpotlightPlayer(details.goals)
  if (!spotlight) return null

  const player = details.players.get(spotlight.playerId)
  const pictureUrl = player?.pictureUrl

  return {
    playerName: displayPlayerName(spotlight.playerName),
    teamName: spotlight.teamName,
    pictureUrl,
    headline: buildGoalHeadline(
      spotlight.playerName,
      spotlight.goalCount,
      spotlight.lastMinute,
      spotlight.lastMinuteSort,
      spotlight.hasPenalty,
    ),
    subline: scorelineSubline(match),
    goalCount: spotlight.goalCount,
    lastMinute: spotlight.lastMinute,
    backdropTeam: spotlight.teamName,
  }
}

export function buildScorelineHero(
  match: Pick<Match, 'home_team' | 'away_team' | 'home_score' | 'away_score'>,
): MatchHeroShare {
  const home = match.home_score ?? 0
  const away = match.away_score ?? 0
  const winner = winningTeam(match)
  const totalGoals = home + away

  if (winner) {
    const spot = squadSpotlightPlayer(winner)
    if (spot) {
      return {
        playerName: spot.name,
        teamName: spot.teamName,
        headline:
          totalGoals >= 5
            ? `${winner} in a thriller`
            : `${winner} take the points`,
        subline: scorelineSubline(match),
        goalCount: 0,
        backdropTeam: winner,
      }
    }
    return {
      playerName: winner,
      teamName: winner,
      headline: `${winner} take the points`,
      subline: scorelineSubline(match),
      goalCount: 0,
      backdropTeam: winner,
    }
  }

  return {
    playerName: match.home_team,
    teamName: match.home_team,
    headline: `${match.home_team} and ${match.away_team} share the spoils`,
    subline: scorelineSubline(match),
    goalCount: 0,
    backdropTeam: match.home_team,
  }
}

export function buildMatchHero(
  match: Match,
  details: FifaMatchDetails | null,
): MatchHeroShare {
  if (details?.goals.length) {
    return buildMatchHeroFromGoals(match, details) ?? buildScorelineHero(match)
  }
  return buildScorelineHero(match)
}
