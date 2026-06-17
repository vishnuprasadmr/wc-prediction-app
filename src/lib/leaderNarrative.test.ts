import { describe, expect, it } from 'vitest'
import { buildLeaderNarrative } from './leaderNarrative'
import type { LeaderboardEntry } from './types'

function entry(rank: number, name: string, pts: number): LeaderboardEntry {
  return {
    user_id: String(rank),
    display_name: name,
    total_points: pts,
    exact_scores: 0,
    predictions_made: 5,
    rank,
  }
}

describe('buildLeaderNarrative', () => {
  it('returns null with fewer than 2 players', () => {
    expect(buildLeaderNarrative([entry(1, 'Jordan', 40)])).toBeNull()
  })

  it('mentions gap and leader first name', () => {
    const line = buildLeaderNarrative([entry(1, 'Jordan Smith', 45), entry(2, 'Alex', 34)])
    expect(line).toContain('Jordan')
    expect(line).toContain('11')
  })

  it('handles one-point lead', () => {
    const line = buildLeaderNarrative([entry(1, 'Sam Lee', 20), entry(2, 'Pat', 19)])
    expect(line).toContain('single point')
  })
})
