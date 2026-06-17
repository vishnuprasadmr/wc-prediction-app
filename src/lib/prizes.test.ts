import { describe, expect, it } from 'vitest'
import { formatInr, sumPrizeAmounts } from './prizes'

describe('prizes', () => {
  it('formats INR without decimals', () => {
    expect(formatInr(5000)).toMatch(/5,000|5\.000/)
  })

  it('sums prize rows', () => {
    expect(sumPrizeAmounts([{ amount_inr: 1500 }, { amount_inr: 800 }])).toBe(2300)
  })
})
