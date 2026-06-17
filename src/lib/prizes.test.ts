import { describe, expect, it } from 'vitest'
import { formatInr, formatZomatoGiftCardValue, sumPrizeAmounts } from './prizes'

describe('prizes', () => {
  it('formats INR without decimals', () => {
    expect(formatInr(5000)).toMatch(/5,000|5\.000/)
  })

  it('formats Zomato gift card value', () => {
    expect(formatZomatoGiftCardValue(1500)).toContain('Zomato e-gift card')
    expect(formatZomatoGiftCardValue(1500)).toMatch(/1,500|1\.500/)
  })

  it('sums prize rows', () => {
    expect(sumPrizeAmounts([{ amount_inr: 1500 }, { amount_inr: 800 }])).toBe(2300)
  })
})
