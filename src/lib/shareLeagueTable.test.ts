import { describe, expect, it } from 'vitest'
import { parseGoalMinuteSort } from './fifaMatchDetails'
import { buildMatchHero, buildMatchHeroFromGoals } from './matchHeroStory'
import { buildLeagueTableShareText } from './shareLeagueTable'
import { getLastFinishedMatch } from './matchUtils'
import type { LeaderboardEntry, Match } from './types'
import type { FifaMatchDetails } from './fifaMatchDetails'

describe('parseGoalMinuteSort', () => {
  it('parses regular and stoppage minutes', () => {
    expect(parseGoalMinuteSort("23'")).toBe(23)
    expect(parseGoalMinuteSort("90'+6'")).toBe(96)
  })
})

describe('buildMatchHeroFromGoals', () => {
  const match = {
    home_team: 'Argentina',
    away_team: 'France',
    home_score: 3,
    away_score: 2,
  } as Match

  const details: FifaMatchDetails = {
    idMatch: '1',
    idStage: '1',
    homeTeam: 'Argentina',
    awayTeam: 'France',
    homeScore: 3,
    awayScore: 2,
    players: new Map([
      [
        '10',
        {
          name: 'Lionel Messi',
          shortName: 'Messi',
          pictureUrl: '/api/fifa-media/transform/messi',
          teamName: 'Argentina',
        },
      ],
    ]),
    goals: [
      {
        playerId: '10',
        playerName: 'Messi',
        teamName: 'Argentina',
        minute: "23'",
        minuteSort: 23,
        isPenalty: false,
        isOwnGoal: false,
      },
      {
        playerId: '10',
        playerName: 'Messi',
        teamName: 'Argentina',
        minute: "78'",
        minuteSort: 78,
        isPenalty: false,
        isOwnGoal: false,
      },
      {
        playerId: '10',
        playerName: 'Messi',
        teamName: 'Argentina',
        minute: "90'+3'",
        minuteSort: 93,
        isPenalty: false,
        isOwnGoal: false,
      },
    ],
  }

  it('highlights a hat-trick scorer', () => {
    const hero = buildMatchHeroFromGoals(match, details)
    expect(hero?.headline).toContain('hat-trick')
    expect(hero?.goalCount).toBe(3)
    expect(hero?.pictureUrl).toContain('messi')
  })
})

describe('buildMatchHero fallback', () => {
  it('uses scoreline when no goal data', () => {
    const match = {
      home_team: 'Mexico',
      away_team: 'South Africa',
      home_score: 2,
      away_score: 0,
    } as Match
    const hero = buildMatchHero(match, null)
    expect(hero.subline).toContain('Mexico 2–0 South Africa')
    expect(hero.headline).toContain('Mexico')
  })
})

describe('buildLeagueTableShareText', () => {
  const entries: LeaderboardEntry[] = [
    {
      user_id: '1',
      display_name: 'Alex',
      total_points: 42,
      exact_scores: 3,
      predictions_made: 5,
      rank: 1,
    },
  ]

  it('includes hero headline instead of quotes', () => {
    const text = buildLeagueTableShareText({
      entries,
      hero: {
        playerName: 'Messi',
        teamName: 'Argentina',
        headline: 'Messi with a hat-trick!',
        subline: 'Argentina 3–2 France',
        goalCount: 3,
      },
    })
    expect(text).toContain('hat-trick')
    expect(text).toContain('Alex')
    expect(text).not.toContain('Gary Lineker')
  })
})

describe('getLastFinishedMatch', () => {
  it('returns most recent finished match by kickoff', () => {
    const matches = [
      {
        id: 'a',
        status: 'finished',
        kickoff_at: '2026-06-10T18:00:00Z',
        home_score: 1,
        away_score: 0,
        home_team: 'A',
        away_team: 'B',
      },
      {
        id: 'b',
        status: 'finished',
        kickoff_at: '2026-06-12T18:00:00Z',
        home_score: 2,
        away_score: 2,
        home_team: 'C',
        away_team: 'D',
      },
    ] as Match[]

    expect(getLastFinishedMatch(matches)?.id).toBe('b')
  })
})
