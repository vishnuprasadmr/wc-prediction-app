import { describe, expect, it } from 'vitest'
import { hasFinishedMatches } from './leaderboardUtils'
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
})
