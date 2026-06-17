import { describe, expect, it } from 'vitest'
import {
  findMealChallengeWinners,
  getMatchClaimOutcome,
  isClaimCorrect,
} from './mealChallenges'
import type { Match } from './types'

const finished: Pick<Match, 'home_score' | 'away_score' | 'status'> = {
  status: 'finished',
  home_score: 2,
  away_score: 1,
}

const picks = [
  {
    user_id: 'a',
    display_name: 'Alex',
    home_pred: 2,
    away_pred: 1,
    created_at: '2026-06-10T10:00:00Z',
  },
  {
    user_id: 'b',
    display_name: 'Blair',
    home_pred: 2,
    away_pred: 1,
    created_at: '2026-06-10T11:00:00Z',
  },
  {
    user_id: 'c',
    display_name: 'Casey',
    home_pred: 1,
    away_pred: 0,
    created_at: '2026-06-10T09:00:00Z',
  },
]

describe('findMealChallengeWinners', () => {
  it('picks exact scorers earliest first', () => {
    const winners = findMealChallengeWinners(finished, picks, 'exact_score')
    expect(winners.map((w) => w.user_id)).toEqual(['a', 'b'])
  })

  it('accepts correct result without exact line', () => {
    const winners = findMealChallengeWinners(finished, picks, 'correct_result')
    expect(winners.map((w) => w.user_id)).toEqual(['c', 'a', 'b'])
  })
})

describe('claim outcome', () => {
  it('reads home win from scoreline', () => {
    expect(getMatchClaimOutcome(finished)).toBe('home_win')
    expect(isClaimCorrect(finished, 'home_win')).toBe(true)
    expect(isClaimCorrect(finished, 'away_win')).toBe(false)
  })
})
