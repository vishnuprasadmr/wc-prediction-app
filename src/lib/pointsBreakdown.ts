import { calculatePoints, type ScoreBreakdown } from './scoring'

export function explainPoints(
  homePred: number,
  awayPred: number,
  homeActual: number,
  awayActual: number,
  firstBonus = 0,
): { breakdown: ScoreBreakdown; lines: string[]; total: number } {
  const breakdown = calculatePoints({
    homePred,
    awayPred,
    homeActual,
    awayActual,
  })

  const lines: string[] = []

  if (breakdown.exact) {
    lines.push('Exact score (5 pts)')
  } else {
    if (breakdown.correctResult) lines.push('Correct result (+2)')
    if (breakdown.correctGoalDiff) lines.push('Correct goal difference (+1)')
    if (breakdown.oneTeamGoalsCorrect) lines.push("One team's goals correct (+1)")
    if (lines.length === 0) lines.push('No scoring categories matched')
  }

  if (firstBonus > 0) lines.push('Early bird (+1)')

  return {
    breakdown,
    lines,
    total: breakdown.total + firstBonus,
  }
}
