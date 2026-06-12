import { describe, expect, it } from 'vitest'
import {
  getSeasonQuestionnaireLockAt,
  isSeasonQuestionnaireLocked,
} from './seasonQuestionnaireLock'
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

describe('seasonQuestionnaireLock', () => {
  it('does not lock when only group matches have kicked off', () => {
    const matches = [
      match({ stage: 'Group', kickoff_at: '2026-06-11T18:30:00Z' }),
      match({ stage: 'Group', kickoff_at: '2026-06-12T18:30:00Z' }),
    ]
    const now = new Date('2026-06-13T00:00:00Z').getTime()
    expect(isSeasonQuestionnaireLocked(matches, now)).toBe(false)
  })

  it('locks at the first knockout kickoff', () => {
    const matches = [
      match({ stage: 'Group', kickoff_at: '2026-06-11T18:30:00Z' }),
      match({ stage: 'Round of 32', kickoff_at: '2026-07-05T18:30:00Z' }),
      match({ stage: 'Round of 16', kickoff_at: '2026-07-10T18:30:00Z' }),
    ]
    const lockAt = getSeasonQuestionnaireLockAt(matches)
    expect(lockAt?.toISOString()).toBe('2026-07-05T18:30:00.000Z')
    expect(isSeasonQuestionnaireLocked(matches, new Date('2026-07-05T19:00:00Z').getTime())).toBe(
      true,
    )
    expect(isSeasonQuestionnaireLocked(matches, new Date('2026-07-01T00:00:00Z').getTime())).toBe(
      false,
    )
  })
})
