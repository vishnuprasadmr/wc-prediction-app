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

export const ZOMATO_GIFT_CARD_LABEL = 'Zomato e-gift card'
export const ZOMATO_GIFT_CARD_TAGLINE = 'Instant delivery · Valid for online orders on Zomato'

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatZomatoGiftCardValue(amount: number): string {
  return `${formatInr(amount)} ${ZOMATO_GIFT_CARD_LABEL}`
}

export function sumPrizeAmounts(prizes: Pick<LeaguePrize, 'amount_inr'>[]): number {
  return prizes.reduce((sum, p) => sum + p.amount_inr, 0)
}
