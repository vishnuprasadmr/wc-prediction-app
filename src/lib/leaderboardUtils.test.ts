import { describe, expect, it } from 'vitest'
import { filterLeaderboardByLeague, hasFinishedMatches, sortPlayersAlphabetically } from './leaderboardUtils'
import type { LeaderboardEntry } from './types'
import { makeMatch, resetFixtureCounters } from '../test/fixtures'

describe('leaderboardUtils', () => {
  it('returns false when no matches have finished', () => {
    resetFixtureCounters()
    const matches = [
      makeMatch({ status: 'scheduled' }),
      makeMatch({ status: 'live' }),
    ]
    expect(hasFinishedMatches(matches)).toBe(false)
  })

  it('returns true when at least one match has finished', () => {
    resetFixtureCounters()
    const matches = [
      makeMatch({ status: 'scheduled' }),
      makeMatch({ status: 'finished' }),
    ]
    expect(hasFinishedMatches(matches)).toBe(true)
  })

  it('respects stage filter', () => {
    resetFixtureCounters()
    const matches = [
      makeMatch({ status: 'finished', stage: 'Group' }),
      makeMatch({ status: 'scheduled', stage: 'Final' }),
    ]
    expect(hasFinishedMatches(matches, 'Group')).toBe(true)
    expect(hasFinishedMatches(matches, 'Final')).toBe(false)
    expect(hasFinishedMatches(matches, 'all')).toBe(true)
  })

  it('sorts players alphabetically for pre-tournament roster', () => {
    const entries: LeaderboardEntry[] = [
      { user_id: '1', display_name: 'Zara', total_points: 0, exact_scores: 0, early_bonuses: 0, predictions_made: 0, rank: 1 },
      { user_id: '2', display_name: 'Arun', total_points: 0, exact_scores: 0, early_bonuses: 0, predictions_made: 1, rank: 2 },
      { user_id: '3', display_name: 'Maya', total_points: 0, exact_scores: 0, early_bonuses: 0, predictions_made: 0, rank: 3 },
    ]
    const sorted = sortPlayersAlphabetically(entries).map((e) => e.display_name)
    expect(sorted).toEqual(['Arun', 'Maya', 'Zara'])
  })

  it('filters Simelabs table to verified SML IDs and re-ranks', () => {
    const entries: LeaderboardEntry[] = [
      { user_id: '1', display_name: 'A', employee_id: 'SML 1', total_points: 10, exact_scores: 0, predictions_made: 1, rank: 1 },
      { user_id: '2', display_name: 'B', employee_id: null, total_points: 20, exact_scores: 0, predictions_made: 1, rank: 2 },
      { user_id: '3', display_name: 'C', employee_id: 'SML 2', total_points: 5, exact_scores: 0, predictions_made: 1, rank: 3 },
    ]
    const simelabs = filterLeaderboardByLeague(entries, 'simelabs')
    expect(simelabs.map((e) => e.display_name)).toEqual(['A', 'C'])
    expect(simelabs.map((e) => e.rank)).toEqual([1, 2])
    expect(filterLeaderboardByLeague(entries, 'global')).toHaveLength(3)
  })
})
