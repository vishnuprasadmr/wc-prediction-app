import { describe, expect, it } from 'vitest'
import {
  basePointsEarned,
  calculatePoints,
  calculateShootoutBonus,
  isExactScorePoints,
} from './scoring'

describe('early bird helpers', () => {
  it('separates base points from early bonus', () => {
    expect(basePointsEarned(6, 1)).toBe(5)
    expect(isExactScorePoints(6, 1)).toBe(true)
    expect(isExactScorePoints(5, 0)).toBe(true)
  })

  it('subtracts the shootout bonus when detecting an exact score', () => {
    // exact draw (5) + shootout winner (2) = 7, with no early bonus
    expect(basePointsEarned(7, 0, 2)).toBe(5)
    expect(isExactScorePoints(7, 0, 2)).toBe(true)
    // exact draw (5) + winner (2) + exact pens (1) + early (1) = 9
    expect(isExactScorePoints(9, 1, 3)).toBe(true)
  })
})

describe('calculateShootoutBonus', () => {
  const wonOnPens = {
    actualHomePens: 4,
    actualAwayPens: 3,
  }

  it('awards nothing when the match did not go to penalties', () => {
    const r = calculateShootoutBonus({
      predWinner: 'home',
      predictedDraw: true,
      actualHomePens: null,
      actualAwayPens: null,
    })
    expect(r.wentToShootout).toBe(false)
    expect(r.bonus).toBe(0)
  })

  it('awards nothing when the user did not predict a draw', () => {
    const r = calculateShootoutBonus({
      predWinner: 'home',
      predictedDraw: false,
      ...wonOnPens,
    })
    expect(r.bonus).toBe(0)
  })

  it('awards +2 for the correct shootout winner', () => {
    const r = calculateShootoutBonus({
      predWinner: 'home',
      predictedDraw: true,
      ...wonOnPens,
    })
    expect(r.correctWinner).toBe(true)
    expect(r.exactPenScore).toBe(false)
    expect(r.bonus).toBe(2)
  })

  it('awards +3 for the correct winner and exact penalty score', () => {
    const r = calculateShootoutBonus({
      predWinner: 'home',
      predHomePens: 4,
      predAwayPens: 3,
      predictedDraw: true,
      ...wonOnPens,
    })
    expect(r.correctWinner).toBe(true)
    expect(r.exactPenScore).toBe(true)
    expect(r.bonus).toBe(3)
  })

  it('awards nothing for the wrong shootout winner', () => {
    const r = calculateShootoutBonus({
      predWinner: 'away',
      predictedDraw: true,
      ...wonOnPens,
    })
    expect(r.correctWinner).toBe(false)
    expect(r.bonus).toBe(0)
  })
})

describe('calculatePoints', () => {
  it('awards 5 points for an exact score', () => {
    const result = calculatePoints({
      homePred: 2,
      awayPred: 1,
      homeActual: 2,
      awayActual: 1,
    })
    expect(result.total).toBe(5)
    expect(result.exact).toBe(true)
    expect(result.correctResult).toBe(true)
    expect(result.correctGoalDiff).toBe(true)
    expect(result.oneTeamGoalsCorrect).toBe(true)
  })

  it('awards 0 for a completely wrong prediction', () => {
    const result = calculatePoints({
      homePred: 0,
      awayPred: 1,
      homeActual: 2,
      awayActual: 0,
    })
    expect(result.total).toBe(0)
    expect(result.exact).toBe(false)
    expect(result.correctResult).toBe(false)
    expect(result.correctGoalDiff).toBe(false)
    expect(result.oneTeamGoalsCorrect).toBe(false)
  })

  it('awards 3 for correct result and goal difference', () => {
    const result = calculatePoints({
      homePred: 2,
      awayPred: 0,
      homeActual: 3,
      awayActual: 1,
    })
    expect(result.total).toBe(3)
    expect(result.correctResult).toBe(true)
    expect(result.correctGoalDiff).toBe(true)
    expect(result.oneTeamGoalsCorrect).toBe(false)
  })

  it('awards 2 for correct result only', () => {
    const result = calculatePoints({
      homePred: 2,
      awayPred: 1,
      homeActual: 3,
      awayActual: 0,
    })
    expect(result.total).toBe(2)
    expect(result.correctResult).toBe(true)
    expect(result.correctGoalDiff).toBe(false)
  })

  it('awards 3 for correct result and one team goals', () => {
    const result = calculatePoints({
      homePred: 1,
      awayPred: 0,
      homeActual: 2,
      awayActual: 0,
    })
    expect(result.total).toBe(3)
    expect(result.correctResult).toBe(true)
    expect(result.oneTeamGoalsCorrect).toBe(true)
  })

  it('never awards more than 5 points', () => {
    const result = calculatePoints({
      homePred: 4,
      awayPred: 3,
      homeActual: 4,
      awayActual: 3,
    })
    expect(result.total).toBeLessThanOrEqual(5)
    expect(result.total).toBe(5)
  })

  it('awards 1 for one correct team score only', () => {
    const result = calculatePoints({
      homePred: 2,
      awayPred: 2,
      homeActual: 2,
      awayActual: 0,
    })
    expect(result.total).toBe(1)
    expect(result.oneTeamGoalsCorrect).toBe(true)
  })

  it('handles draws correctly', () => {
    const result = calculatePoints({
      homePred: 1,
      awayPred: 1,
      homeActual: 0,
      awayActual: 0,
    })
    expect(result.total).toBe(3)
    expect(result.correctResult).toBe(true)
    expect(result.correctGoalDiff).toBe(true)
  })

  it('awards 3 for correct result and goal difference without exact score', () => {
    const result = calculatePoints({
      homePred: 2,
      awayPred: 0,
      homeActual: 3,
      awayActual: 1,
    })
    expect(result.total).toBe(3)
    expect(result.exact).toBe(false)
    expect(result.correctResult).toBe(true)
    expect(result.correctGoalDiff).toBe(true)
  })

  it('awards 3 for away win with matching margin but different scores', () => {
    const result = calculatePoints({
      homePred: 0,
      awayPred: 2,
      homeActual: 1,
      awayActual: 3,
    })
    expect(result.total).toBe(3)
    expect(result.correctResult).toBe(true)
    expect(result.correctGoalDiff).toBe(true)
    expect(result.oneTeamGoalsCorrect).toBe(false)
  })
})
