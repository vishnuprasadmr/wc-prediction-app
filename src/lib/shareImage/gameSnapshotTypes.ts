import type { LeaderboardEntry } from '../types'

export interface GameSnapshotMealRow {
  kind: 'live' | 'settled'
  matchLabel: string
  line: string
  subline?: string
}

export interface GameSnapshotInput {
  leagueLabel: string
  dateLabel: string
  finishedMatchCount: number
  liveMealCount: number
  settledMealCount: number
  topThree: LeaderboardEntry[]
  lastMatchLabel?: string
  lastMatchScore?: string
  mealRows: GameSnapshotMealRow[]
}
