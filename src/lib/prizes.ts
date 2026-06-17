export interface LeaguePrizeConfig {
  published: boolean
  headline: string
  intro: string
  total_inr: number
  footer_note: string
  updated_at?: string
}

export interface LeaguePrize {
  id: string
  sort_order: number
  title: string
  amount_inr: number
  winner_rule: string
  description: string | null
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function sumPrizeAmounts(prizes: Pick<LeaguePrize, 'amount_inr'>[]): number {
  return prizes.reduce((sum, p) => sum + p.amount_inr, 0)
}
