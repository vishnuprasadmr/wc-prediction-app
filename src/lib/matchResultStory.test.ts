import { describe, expect, it } from 'vitest'
import { buildGoalScorerLines, buildMatchResultShare } from './matchResultStory'
import type { FifaMatchDetails } from './fifaMatchDetails'
import type { Match } from './types'

describe('buildGoalScorerLines', () => {
  it('groups goals by player', () => {
    const lines = buildGoalScorerLines([
      {
        playerId: '1',
        playerName: 'Messi',
        teamName: 'Argentina',
        minute: "23'",
        minuteSort: 23,
        isPenalty: false,
        isOwnGoal: false,
      },
      {
        playerId: '1',
        playerName: 'Messi',
        teamName: 'Argentina',
        minute: "78'",
        minuteSort: 78,
        isPenalty: false,
        isOwnGoal: false,
      },
    ])
    expect(lines).toHaveLength(1)
    expect(lines[0]?.goalCount).toBe(2)
    expect(lines[0]?.minutes).toEqual(['23', '78'])
  })
})

describe('buildMatchResultShare', () => {
  it('marks clean sheet wins', () => {
    const match = {
      home_team: 'Mexico',
      away_team: 'South Africa',
      home_score: 2,
      away_score: 0,
      stage: 'Group',
      group_name: 'A',
    } as Match

    const result = buildMatchResultShare(match, null)
    expect(result.winnerLabel).toBe('MEXICO WIN')
    expect(result.isCleanSheet).toBe(true)
  })

  it('lists scorers from fifa details', () => {
    const match = {
      home_team: 'Mexico',
      away_team: 'South Africa',
      home_score: 2,
      away_score: 0,
      stage: 'Group',
      group_name: 'A',
    } as Match

    const details: FifaMatchDetails = {
      idMatch: '1',
      idStage: '1',
      homeTeam: 'Mexico',
      awayTeam: 'South Africa',
      homeScore: 2,
      awayScore: 0,
      players: new Map(),
      goals: [
        {
          playerId: '9',
          playerName: 'Jimenez',
          teamName: 'Mexico',
          minute: "55'",
          minuteSort: 55,
          isPenalty: false,
          isOwnGoal: false,
        },
      ],
    }

    const result = buildMatchResultShare(match, details)
    expect(result.scorers).toHaveLength(1)
    expect(result.scorers[0]?.playerName).toBe('Jimenez')
  })
})
