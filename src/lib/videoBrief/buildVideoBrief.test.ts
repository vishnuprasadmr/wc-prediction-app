import { describe, expect, it } from 'vitest'
import { buildVideoBrief } from './buildVideoBrief'
import { buildVideoPrompt } from './buildVideoPrompt'
import type { LeaderboardEntry, Match } from '../types'

const NOW = new Date('2026-06-30T12:00:00Z').getTime()

function entry(over: Partial<LeaderboardEntry> & { rank: number }): LeaderboardEntry {
  return {
    user_id: `u${over.rank}`,
    display_name: `Player ${over.rank}`,
    avatar_url: `https://example.com/${over.rank}.jpg`,
    total_points: 100 - over.rank * 10,
    exact_scores: 5 - over.rank,
    predictions_made: 10,
    ...over,
  }
}

function match(over: Partial<Match> & { id: string }): Match {
  return {
    api_fixture_id: null,
    stage: 'Group',
    group_name: 'A',
    home_team: 'Brazil',
    away_team: 'Morocco',
    home_flag: '🇧🇷',
    away_flag: '🇲🇦',
    kickoff_at: '2026-06-30T18:00:00Z',
    status: 'finished',
    home_score: 2,
    away_score: 1,
    home_penalties: null,
    away_penalties: null,
    score_source: 'api',
    manual_override: false,
    ...over,
  }
}

const entries = [entry({ rank: 1 }), entry({ rank: 2 }), entry({ rank: 3 }), entry({ rank: 4 })]

describe('buildVideoBrief', () => {
  it('builds standings with top 3 and top N', () => {
    const brief = buildVideoBrief({
      leagueLabel: 'Global league',
      entries,
      matches: [match({ id: 'm1' })],
      topN: 3,
      now: NOW,
    })

    expect(brief.standings.topThree).toHaveLength(3)
    expect(brief.standings.topTen).toHaveLength(3)
    expect(brief.standings.totalPlayers).toBe(4)
    expect(brief.standings.topThree[0].name).toBe('Player 1')
  })

  it('derives a leader-vs-chasers face-off with the points gap', () => {
    const brief = buildVideoBrief({
      leagueLabel: 'Global league',
      entries,
      matches: [],
      now: NOW,
    })

    expect(brief.faceOff).not.toBeNull()
    expect(brief.faceOff!.leader.rank).toBe(1)
    expect(brief.faceOff!.gapToSecond).toBe(10)
    expect(brief.faceOff!.narrative).toContain('Player 1')
  })

  it('selects today\'s matches and renders a result label', () => {
    const brief = buildVideoBrief({
      leagueLabel: 'Global league',
      entries,
      matches: [match({ id: 'm1' })],
      now: NOW,
    })

    expect(brief.matches).toHaveLength(1)
    expect(brief.matches[0].resultLabel).toBe('Brazil 2–1 Morocco')
  })

  it('annotates shootout results', () => {
    const brief = buildVideoBrief({
      leagueLabel: 'Global league',
      entries,
      matches: [
        match({
          id: 'm1',
          stage: 'Round of 16',
          group_name: null,
          home_score: 1,
          away_score: 1,
          home_penalties: 4,
          away_penalties: 2,
        }),
      ],
      now: NOW,
    })

    expect(brief.matches[0].wentToShootout).toBe(true)
    expect(brief.matches[0].resultLabel).toContain('pens')
  })

  it('attaches crowd sentiment when provided', () => {
    const brief = buildVideoBrief({
      leagueLabel: 'Global league',
      entries,
      matches: [match({ id: 'm1' })],
      crowdByMatchId: {
        m1: { homeWinPct: 60, drawPct: 25, awayWinPct: 15, totalPicks: 20, label: 'League says: 60% Brazil win' },
      },
      now: NOW,
    })

    expect(brief.predictions.matchCrowd).toHaveLength(1)
    expect(brief.matches[0].crowd?.totalPicks).toBe(20)
  })

  it('picks the sharpest predictor by exact scores', () => {
    const brief = buildVideoBrief({
      leagueLabel: 'Global league',
      entries: [
        entry({ rank: 1, exact_scores: 2 }),
        entry({ rank: 2, exact_scores: 9 }),
      ],
      matches: [],
      now: NOW,
    })

    expect(brief.predictions.sharpestPredictor?.name).toBe('Player 2')
  })

  it('maps featured players into reusable image assets', () => {
    const brief = buildVideoBrief({
      leagueLabel: 'Global league',
      entries,
      matches: [],
      topN: 3,
      now: NOW,
    })

    expect(brief.assets).toHaveLength(3)
    expect(brief.assets[0].ref).toBe('player-1')
    expect(brief.standings.topThree[0].assetRef).toBe('player-1')
  })

  it('always includes intro and outro scenes', () => {
    const brief = buildVideoBrief({
      leagueLabel: 'Global league',
      entries,
      matches: [match({ id: 'm1' })],
      now: NOW,
    })

    const ids = brief.scenes.map((s) => s.id)
    expect(ids[0]).toBe('intro')
    expect(ids[ids.length - 1]).toBe('outro')
    expect(ids).toContain('top10')
  })
})

describe('buildVideoPrompt', () => {
  it('renders a copy-paste prompt with scenes and assets', () => {
    const brief = buildVideoBrief({
      leagueLabel: 'Global league',
      entries,
      matches: [match({ id: 'm1' })],
      topN: 3,
      now: NOW,
    })
    const prompt = buildVideoPrompt(brief)

    expect(prompt).toContain('STORYBOARD')
    expect(prompt).toContain('Scene 1 — Intro sting')
    expect(prompt).toContain('PROFILE PICTURES')
    expect(prompt).toContain('player-1 = Player 1')
  })
})
