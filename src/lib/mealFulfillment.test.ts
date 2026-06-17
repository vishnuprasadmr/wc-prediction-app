import { describe, expect, it } from 'vitest'
import { creatorOwesMealFulfillment } from './mealFulfillment'
import { buildMealFulfillmentShare, buildMealFulfillmentShareText } from './shareMealChallenge'
import type { MealChallengeView } from '../hooks/useMealChallenges'

const baseChallenge: MealChallengeView = {
  id: '1',
  match_id: 'm1',
  creator_id: 'u1',
  claim_text: 'Portugal will win',
  stake_text: 'Chicken mandi',
  backed_outcome: 'home_win',
  win_condition: 'exact_score',
  status: 'settled',
  reject_reason: null,
  approved_by: null,
  approved_at: null,
  winner_user_id: 'u2',
  winner_note: null,
  settled_at: '2026-06-20T22:00:00Z',
  settled_by: 'admin',
  claim_correct: false,
  fulfillment_photo_url: 'https://example.com/meal.jpg',
  fulfillment_posted_at: null,
  created_at: '',
  updated_at: '',
  creator_name: 'Alex',
  winner_name: 'Blair',
  match: {
    id: 'm1',
    api_fixture_id: null,
    stage: 'Group',
    group_name: 'G',
    home_team: 'Portugal',
    away_team: 'Morocco',
    home_flag: 'pt',
    away_flag: 'ma',
    kickoff_at: '2026-06-20T18:30:00Z',
    home_score: 1,
    away_score: 1,
    status: 'finished',
    score_source: 'api',
    manual_override: false,
  },
  acceptances: [
    {
      id: 'a1',
      challenge_id: '1',
      user_id: 'u2',
      points_staked: 1,
      status: 'won',
      points_delta: 1,
      created_at: '',
      display_name: 'Blair',
      home_pred: 3,
      away_pred: 0,
    },
  ],
  total_points_staked: 1,
}

describe('meal fulfillment', () => {
  it('creator owes when claim failed', () => {
    expect(creatorOwesMealFulfillment(baseChallenge, baseChallenge.match)).toBe(true)
    expect(
      creatorOwesMealFulfillment(
        { ...baseChallenge, claim_correct: true },
        baseChallenge.match,
      ),
    ).toBe(false)
  })

  it('builds fulfillment share card payload', () => {
    const share = buildMealFulfillmentShare(baseChallenge)
    expect(share?.mode).toBe('fulfillment')
    expect(share?.photoUrl).toContain('meal.jpg')
    const text = buildMealFulfillmentShareText(share!)
    expect(text).toContain('paid up')
    expect(text).toContain('Chicken mandi')
  })
})
