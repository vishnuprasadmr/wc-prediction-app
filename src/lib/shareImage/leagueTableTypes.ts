import type { LeaderboardEntry } from '../types'
import type { MatchHeroShare } from '../matchHeroStory'

export interface LeagueTableShareMatch {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  stageLabel?: string
}

export interface LeagueTableShareInput {
  entries: LeaderboardEntry[]
  hero?: MatchHeroShare
  dateLabel: string
  lastMatch?: LeagueTableShareMatch
  leagueLabel?: string
}
