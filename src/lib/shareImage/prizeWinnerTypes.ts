export interface PrizeWinnerShareInput {
  prizeTitle: string
  winnerName: string
  winnerAvatarUrl?: string | null
  amountInr: number
  amountLabel: string
  maskedCard: string | null
  dateLabel: string
}
