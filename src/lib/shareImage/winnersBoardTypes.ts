export interface WinnersBoardEntry {
  prizeTitle: string
  winnerName: string
  winnerAvatarUrl?: string | null
  amountLabel: string
  badge?: string | null
}

export interface WinnersBoardShareInput {
  headline: string
  poolLabel: string
  dateLabel: string
  winners: WinnersBoardEntry[]
}
