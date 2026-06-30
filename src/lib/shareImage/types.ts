import type { ShareImageVariant } from './theme'

export interface ShareImageMatch {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  homePred?: number
  awayPred?: number
  pointsEarned?: number | null
  firstBonus?: number
  shootoutBonus?: number
}

export interface ShareImageInput {
  variant: ShareImageVariant
  displayName: string
  avatarUrl?: string | null
  rank: number
  totalPoints: number
  exactScores: number
  match?: ShareImageMatch
}
