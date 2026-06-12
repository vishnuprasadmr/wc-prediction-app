import { describe, expect, it } from 'vitest'
import { explainPoints } from './pointsBreakdown'

describe('explainPoints', () => {
  it('describes exact score', () => {
    const { lines, total } = explainPoints(2, 1, 2, 1)
    expect(lines).toContain('Exact score (5 pts)')
    expect(total).toBe(5)
  })

  it('includes early bird line', () => {
    const { lines, total } = explainPoints(2, 1, 2, 0, 1)
    expect(lines).toContain('Early bird (+1)')
    expect(total).toBe(4)
  })
})
