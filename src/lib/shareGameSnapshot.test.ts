import { describe, expect, it } from 'vitest'
import { buildGameSnapshotInput, buildGameSnapshotShareText } from './shareGameSnapshot'
import type { LeaderboardEntry } from './types'

const entries: LeaderboardEntry[] = [
  {
    user_id: '1',
    display_name: 'Alex',
    total_points: 45,
    exact_scores: 3,
    rank: 1,
    predictions_made: 10,
  },
  {
    user_id: '2',
    display_name: 'Blair',
    total_points: 40,
    exact_scores: 2,
    rank: 2,
    predictions_made: 9,
  },
  {
    user_id: '3',
    display_name: 'Casey',
    total_points: 38,
    exact_scores: 1,
    rank: 3,
    predictions_made: 8,
  },
]

describe('buildGameSnapshotShareText', () => {
  it('includes top 3 and meal rows', () => {
    const input = buildGameSnapshotInput({
      entries,
      leagueLabel: 'Simelabs league',
      finishedMatchCount: 12,
      liveMealBets: [
        {
          id: 'm1',
          claim_text: 'Portugal wins',
          creator_name: 'Alex',
          stake_text: 'Mandi',
          acceptances: [{ display_name: 'Blair', points_delta: null } as never],
          total_points_staked: 1,
          match: {
            home_team: 'Portugal',
            away_team: 'Morocco',
            home_score: null,
            away_score: null,
          } as never,
        } as never,
      ],
      settledMealBets: [],
      lastMatch: {
        home_team: 'Brazil',
        away_team: 'France',
        home_score: 2,
        away_score: 1,
      } as never,
    })

    const text = buildGameSnapshotShareText(input)
    expect(text).toContain('Alex')
    expect(text).toContain('Meal bets')
    expect(text).toContain('Brazil vs France')
    expect(text).toContain('Portugal wins')
  })
})
