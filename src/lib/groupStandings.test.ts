import { describe, expect, it } from 'vitest'
import { buildGroupStandings } from './groupStandings'
import type { Match } from './types'

function groupMatch(
  group: string,
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
): Match {
  return {
    id: `${home}-${away}`,
    api_fixture_id: 1,
    stage: 'Group',
    group_name: group,
    home_team: home,
    away_team: away,
    home_flag: '',
    away_flag: '',
    kickoff_at: '2026-06-12T18:30:00Z',
    status: 'finished',
    home_score: homeScore,
    away_score: awayScore,
    score_source: 'api',
    manual_override: false,
  }
}

describe('buildGroupStandings', () => {
  it('computes points and goal difference', () => {
    const standings = buildGroupStandings([
      groupMatch('A', 'Brazil', 'Serbia', 2, 0),
      groupMatch('A', 'Switzerland', 'Cameroon', 1, 1),
      groupMatch('A', 'Brazil', 'Switzerland', 1, 0),
    ])

    expect(standings).toHaveLength(1)
    expect(standings[0].group).toBe('A')
    expect(standings[0].teams[0]).toMatchObject({
      team: 'Brazil',
      played: 2,
      won: 2,
      points: 6,
      goalDiff: 3,
    })
  })
})
