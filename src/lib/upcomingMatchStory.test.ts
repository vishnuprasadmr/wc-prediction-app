import { describe, expect, it } from 'vitest'
import { buildUpcomingMatchShare } from './upcomingMatchStory'
import type { Match } from './types'

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    api_fixture_id: 1001,
    stage: 'Group',
    group_name: 'A',
    home_team: 'Argentina',
    away_team: 'France',
    home_flag: 'ar',
    away_flag: 'fr',
    kickoff_at: '2026-06-20T18:30:00.000Z',
    status: 'scheduled',
    home_score: null,
    away_score: null,
    score_source: null,
    manual_override: false,
    ...overrides,
  }
}

describe('buildUpcomingMatchShare', () => {
  it('includes IST kickoff and captain names', () => {
    const share = buildUpcomingMatchShare(makeMatch(), null)

    expect(share.kickoffLabel).toContain('IST')
    expect(share.homeCaptain.name).toBe('Lionel Messi')
    expect(share.awayCaptain.name).toBe('Kylian Mbappé')
    expect(share.lockTimeLabel).toMatch(/^\d{2}:\d{2}$/)
    expect(share.hero.headline).toContain('Messi')
  })

  it('includes crowd pick percentages when available', () => {
    const share = buildUpcomingMatchShare(makeMatch(), null, {
      homeWinPct: 62,
      drawPct: 18,
      awayWinPct: 20,
      totalPicks: 25,
    })

    expect(share.crowdLabel).toBe('Simelabs thinks: 62% Argentina win')
    expect(share.crowdSentiment?.totalPicks).toBe(25)
  })
})
