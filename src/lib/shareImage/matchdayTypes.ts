import type { Match } from '../types'

export interface MatchdayRow {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
}

export interface MatchdayCardInput {
  title: string
  subtitle: string
  matches: MatchdayRow[]
  dateLabel: string
}
