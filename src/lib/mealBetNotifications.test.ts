import { describe, expect, it } from 'vitest'
import {
  countUnseenActionableMealBets,
  isActionableMealBet,
  markMealBetSeen,
} from './mealBetNotifications'

const userId = 'user-1'
const lockKickoff = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

const liveBet = {
  id: 'c1',
  creator_id: 'user-2',
  match: { kickoff_at: lockKickoff, status: 'scheduled' as const },
  acceptances: [] as { user_id: string }[],
}

describe('mealBetNotifications', () => {
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
})
