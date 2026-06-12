import { describe, expect, it } from 'vitest'
import { computeBadges } from './badges'
import type { PredictionWithMatch } from './types'

function pred(overrides: Partial<PredictionWithMatch>): PredictionWithMatch {
  return {
    id: '1',
    user_id: 'u',
    match_id: 'm',
    home_pred: 1,
    away_pred: 0,
    points_earned: 3,
    first_bonus: 0,
    locked_at: null,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    match: {
      id: 'm',
      api_fixture_id: 1,
      stage: 'Group',
      group_name: 'A',
      home_team: 'A',
      away_team: 'B',
      home_flag: '',
      away_flag: '',
      kickoff_at: '2026-06-01T18:00:00Z',
      status: 'finished',
      home_score: 1,
      away_score: 0,
      score_source: 'api',
      manual_override: false,
    },
    ...overrides,
  }
}

describe('computeBadges', () => {
  it('marks first pick and on board when user has scoring predictions', () => {
    const badges = computeBadges([pred({})])
    expect(badges.find((b) => b.id === 'first_pick')?.earned).toBe(true)
    expect(badges.find((b) => b.id === 'on_board')?.earned).toBe(true)
  })

  it('marks exact badge for 5-point base score', () => {
    const badges = computeBadges([
      pred({ home_pred: 2, away_pred: 1, points_earned: 5, match: { ...pred({}).match, home_score: 2, away_score: 1 } }),
    ])
    expect(badges.find((b) => b.id === 'exact')?.earned).toBe(true)
  })
})
