export type MealChallengeShareMode = 'live' | 'result' | 'fulfillment'

export interface MealChallengeShare {
  mode: MealChallengeShareMode
  homeTeam: string
  awayTeam: string
  kickoffLabel: string
  scoreLabel?: string
  creatorName: string
  claimText: string
  stakeText: string
  claimLabel: string
  winConditionLabel: string
  acceptorsCount: number
  totalPointsStaked: number
  winnerName?: string | null
  winnerNote?: string | null
  ctaLine: string
  badge: string
  photoUrl?: string | null
  acceptorsWonCount?: number
}

export interface MealChallengeCardInput {
  share: MealChallengeShare
  dateLabel: string
}
