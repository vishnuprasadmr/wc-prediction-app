import { describe, expect, it } from 'vitest'
import { buildShareImageInput, buildStandingsShareText } from './shareStandings'

describe('buildStandingsShareText', () => {
  it('includes rank and points', () => {
    const text = buildStandingsShareText({
      displayName: 'Alex',
      rank: 3,
      totalPoints: 42,
      exactScores: 2,
    })
    expect(text).toContain('Alex')
    expect(text).toContain('Rank #3')
    expect(text).toContain('42 pts')
  })
})

describe('buildShareImageInput', () => {
  it('maps last match into share image payload', () => {
    const input = buildShareImageInput({
      variant: 'match-result',
      displayName: 'Alex',
      rank: 2,
      totalPoints: 50,
      exactScores: 4,
      lastMatch: {
        home: 'Brazil',
        away: 'Morocco',
        score: '2-1',
        points: 5,
        homePred: 2,
        awayPred: 1,
        firstBonus: 1,
      },
    })

    expect(input.match?.homeTeam).toBe('Brazil')
    expect(input.match?.awayScore).toBe(1)
    expect(input.match?.pointsEarned).toBe(5)
    expect(input.match?.firstBonus).toBe(1)
  })
})
