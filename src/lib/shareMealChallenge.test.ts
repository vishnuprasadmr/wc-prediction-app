import { describe, expect, it } from 'vitest'
import { buildMealChallengeShare, buildMealChallengeShareText } from './shareMealChallenge'
import type { MealChallengeView } from '../hooks/useMealChallenges'

const challenge: MealChallengeView = {
  id: '1',
  match_id: 'm1',
  creator_id: 'u1',
  claim_text: 'Portugal will win today',
  stake_text: 'Chicken mandi for the exact score predictor',
  backed_outcome: 'away_win',
  win_condition: 'exact_score',
  status: 'approved',
  reject_reason: null,
  approved_by: null,
  approved_at: null,
  winner_user_id: null,
  winner_note: null,
  settled_at: null,
  settled_by: null,
  created_at: '2026-06-10T10:00:00Z',
  updated_at: '2026-06-10T10:00:00Z',
  creator_name: 'Alex',
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
    home_score: null,
    away_score: null,
    status: 'scheduled',
    score_source: 'api',
    manual_override: false,
  },
  acceptances: [{
    id: 'a1',
    challenge_id: '1',
    user_id: 'u2',
    points_staked: 1,
    status: 'active',
    points_delta: null,
    created_at: '',
    display_name: 'Blair',
    home_pred: 1,
    away_pred: 1,
  }],
  total_points_staked: 1,
}

describe('buildMealChallengeShareText', () => {
  it('includes claim and stake for live bets', () => {
    const share = buildMealChallengeShare(challenge, 'live')
    const text = buildMealChallengeShareText(share)
    expect(text).toContain('Portugal will win today')
    expect(text).toContain('Chicken mandi')
    expect(text).toContain('1 pts on the line')
  })

  it('highlights meal winner on result cards', () => {
    const settled: MealChallengeView = {
      ...challenge,
      status: 'settled',
      winner_user_id: 'u3',
      winner_name: 'Casey',
      match: {
        ...challenge.match!,
        status: 'finished',
        home_score: 2,
        away_score: 1,
      },
    }
    const text = buildMealChallengeShareText(buildMealChallengeShare(settled, 'result'))
    expect(text).toContain('Casey wins the meal')
    expect(text).toContain('Final: 2–1')
  })
})
