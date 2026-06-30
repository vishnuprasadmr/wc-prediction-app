import {
  calculatePoints,
  calculateShootoutBonus,
  SHOOTOUT_EXACT_POINTS,
  SHOOTOUT_WINNER_POINTS,
  type ScoreBreakdown,
} from './scoring'
import type { ShootoutWinner } from './types'

export interface ShootoutExplainInput {
  predWinner?: ShootoutWinner | null
  predHomePens?: number | null
  predAwayPens?: number | null
  actualHomePens: number | null
  actualAwayPens: number | null
}

export function explainPoints(
  homePred: number,
  awayPred: number,
  homeActual: number,
  awayActual: number,
  firstBonus = 0,
  shootout?: ShootoutExplainInput,
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

  let shootoutBonus = 0
  if (shootout) {
    const s = calculateShootoutBonus({
      predWinner: shootout.predWinner,
      predHomePens: shootout.predHomePens,
      predAwayPens: shootout.predAwayPens,
      actualHomePens: shootout.actualHomePens,
      actualAwayPens: shootout.actualAwayPens,
      predictedDraw: homePred === awayPred,
    })
    shootoutBonus = s.bonus
    if (s.correctWinner) lines.push(`Shootout winner (+${SHOOTOUT_WINNER_POINTS})`)
    if (s.exactPenScore) lines.push(`Exact penalty score (+${SHOOTOUT_EXACT_POINTS})`)
  }

  if (firstBonus > 0) lines.push('Early bird (+1)')

  return {
    breakdown,
    lines,
    total: breakdown.total + firstBonus + shootoutBonus,
  }
}
