import { describe, expect, it, beforeEach } from 'vitest'
import {
  countUnseenActionableMealBets,
  getOpenMealBetsForUser,
  isActionableMealBet,
  markMealBetSeen,
} from './mealBetNotifications'
import type { Match } from './types'

const userId = 'user-1'
const lockKickoff = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

const baseMatch: Pick<Match, 'kickoff_at' | 'status'> = {
  kickoff_at: lockKickoff,
  status: 'scheduled',
}

const liveBet = {
  id: 'c1',
  creator_id: 'user-2',
  match: baseMatch,
  acceptances: [] as { user_id: string }[],
}

describe('mealBetNotifications', () => {
  beforeEach(() => {
    markMealBetSeen('c1')
    localStorage.removeItem('wc-meal-seen:c1')
  })

  it('counts unseen actionable bets', () => {
    expect(isActionableMealBet(liveBet, userId)).toBe(true)
    expect(countUnseenActionableMealBets([liveBet], userId)).toBe(1)
    markMealBetSeen('c1')
    expect(countUnseenActionableMealBets([liveBet], userId)).toBe(0)
  })

  it('skips own bets and accepted bets', () => {
    expect(isActionableMealBet({ ...liveBet, creator_id: userId }, userId)).toBe(false)
    expect(
      isActionableMealBet(
        { ...liveBet, acceptances: [{ user_id: userId }] },
        userId,
      ),
    ).toBe(false)
  })

  it('locks with match prediction lock', () => {
    const pastKickoff = new Date(Date.now() - 60_000).toISOString()
    const locked = {
      ...liveBet,
      match: { kickoff_at: pastKickoff, status: 'scheduled' as const },
    }
    expect(isActionableMealBet(locked, userId)).toBe(false)
    const finished = { ...liveBet, match: { ...baseMatch, status: 'finished' as const } }
    expect(isActionableMealBet(finished, userId)).toBe(false)
  })

  it('lists open bets for user', () => {
    expect(getOpenMealBetsForUser([liveBet], userId)).toHaveLength(1)
    expect(getOpenMealBetsForUser([liveBet], 'user-2')).toHaveLength(0)
  })
})
