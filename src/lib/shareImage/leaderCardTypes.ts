import type { LeaderboardEntry } from '../types'

export interface LeaderCardInput {
  /** Top 3 predictors — #1 required; #2/#3 optional if fewer players. */
  entries: LeaderboardEntry[]
  leagueLabel: string
  dateLabel: string
  dailyPrompt: string
}
