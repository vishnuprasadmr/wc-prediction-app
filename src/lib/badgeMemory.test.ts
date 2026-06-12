import { beforeEach, describe, expect, it } from 'vitest'
import { getShownBadgeIds, markBadgeShown } from './badgeMemory'

describe('badgeMemory', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('marks a badge as shown per user', () => {
    markBadgeShown('user-a', 'exact')
    expect(getShownBadgeIds('user-a').has('exact')).toBe(true)
    expect(getShownBadgeIds('user-b').has('exact')).toBe(false)
  })

  it('migrates legacy storage key once', () => {
    localStorage.setItem('wc-earned-badges', JSON.stringify(['first_pick', 'on_board']))
    const shown = getShownBadgeIds('user-a')
    expect(shown.has('first_pick')).toBe(true)
    expect(shown.has('on_board')).toBe(true)
    expect(localStorage.getItem('wc-earned-badges')).toBeNull()
  })
})
