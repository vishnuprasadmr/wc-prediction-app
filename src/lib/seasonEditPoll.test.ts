import { describe, expect, it } from 'vitest'
import {
  getSeasonEditLockAt,
  isSeasonEditWindowExpired,
  tallySeasonEditVotes,
} from './seasonEditPoll'
import type { Match } from './types'

function match(partial: Partial<Match> & Pick<Match, 'kickoff_at' | 'stage'>): Match {
  return {
    id: '1',
    api_fixture_id: null,
    group_name: partial.stage === 'Group' ? 'A' : null,
    home_team: 'A',
    away_team: 'B',
    home_flag: '',
    away_flag: '',
    status: 'scheduled',
    home_score: null,
    away_score: null,
    score_source: null,
    manual_override: false,
    ...partial,
  }
}

describe('seasonEditPoll', () => {
  it('tallies yes/no with percentages', () => {
    expect(tallySeasonEditVotes([{ vote: 'yes' }, { vote: 'yes' }, { vote: 'no' }])).toEqual({
      yes: 2,
      no: 1,
      total: 3,
      yesPct: 67,
      noPct: 33,
    })
  })

  it('locks at first Quarter-final kickoff', () => {
    const matches = [
      match({ stage: 'Round of 16', kickoff_at: '2026-07-12T18:30:00Z' }),
      match({ stage: 'Quarter-final', kickoff_at: '2026-07-18T18:30:00Z' }),
      match({ stage: 'Quarter-final', kickoff_at: '2026-07-19T18:30:00Z' }),
      match({ stage: 'Semi-final', kickoff_at: '2026-07-22T18:30:00Z' }),
    ]
    const lockAt = getSeasonEditLockAt(matches)
    expect(lockAt?.toISOString()).toBe('2026-07-18T18:30:00.000Z')
    expect(isSeasonEditWindowExpired(matches, new Date('2026-07-18T19:00:00Z').getTime())).toBe(
      true,
    )
    expect(isSeasonEditWindowExpired(matches, new Date('2026-07-17T00:00:00Z').getTime())).toBe(
      false,
    )
  })
})
