export interface ScoreInput {
  homePred: number
  awayPred: number
  homeActual: number
  awayActual: number
}

export interface ScoreBreakdown {
  total: number
  exact: boolean
  correctResult: boolean
  correctGoalDiff: boolean
  oneTeamGoalsCorrect: boolean
}

function getResult(home: number, away: number): 'home' | 'away' | 'draw' {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

export function calculatePoints(input: ScoreInput): ScoreBreakdown {
  const { homePred, awayPred, homeActual, awayActual } = input

  if (homePred === homeActual && awayPred === awayActual) {
    return {
      total: 5,
      exact: true,
      correctResult: true,
      correctGoalDiff: true,
      oneTeamGoalsCorrect: true,
    }
  }

  let total = 0
  const predResult = getResult(homePred, awayPred)
  const actualResult = getResult(homeActual, awayActual)
  const correctResult = predResult === actualResult

  if (correctResult) total += 2

  const predDiff = homePred - awayPred
  const actualDiff = homeActual - awayActual
  const correctGoalDiff = predDiff === actualDiff

  if (correctGoalDiff) total += 1

  const oneTeamGoalsCorrect = homePred === homeActual || awayPred === awayActual
  if (oneTeamGoalsCorrect) total += 1

  return {
    total,
    exact: false,
    correctResult,
    correctGoalDiff,
    oneTeamGoalsCorrect,
  }
}

export const FIRST_PREDICTION_BONUS = 1

/** Points for correctly picking who advances on penalties (knockout draw). */
export const SHOOTOUT_WINNER_POINTS = 2
/** Extra points for also nailing the exact penalty score. */
export const SHOOTOUT_EXACT_POINTS = 1

export interface ShootoutScoreInput {
  /** User's pick for who wins the shootout. */
  predWinner: 'home' | 'away' | null | undefined
  predHomePens?: number | null
  predAwayPens?: number | null
  /** Actual shootout totals (null when the tie was not decided on penalties). */
  actualHomePens: number | null
  actualAwayPens: number | null
  /** Whether the user predicted a level scoreline (a draw) at full/extra time. */
  predictedDraw: boolean
}

export interface ShootoutBreakdown {
  /** True when the match was actually decided on penalties. */
  wentToShootout: boolean
  correctWinner: boolean
  exactPenScore: boolean
  bonus: number
}

/** Bonus points earned from the penalty shootout (added on top of goal points). */
export function calculateShootoutBonus(input: ShootoutScoreInput): ShootoutBreakdown {
  const wentToShootout =
    input.actualHomePens != null && input.actualAwayPens != null
  const none: ShootoutBreakdown = {
    wentToShootout,
    correctWinner: false,
    exactPenScore: false,
    bonus: 0,
  }

  if (!wentToShootout || !input.predictedDraw || !input.predWinner) return none

  const actualWinner =
    (input.actualHomePens as number) > (input.actualAwayPens as number) ? 'home' : 'away'
  if (input.predWinner !== actualWinner) return none

  const exactPenScore =
    input.predHomePens != null &&
    input.predAwayPens != null &&
    input.predHomePens === input.actualHomePens &&
    input.predAwayPens === input.actualAwayPens

  return {
    wentToShootout,
    correctWinner: true,
    exactPenScore,
    bonus: SHOOTOUT_WINNER_POINTS + (exactPenScore ? SHOOTOUT_EXACT_POINTS : 0),
  }
}

/** Base match points before early-bird and shootout bonuses (goal points only). */
export function basePointsEarned(
  pointsEarned: number,
  firstBonus = 0,
  shootoutBonus = 0,
): number {
  return pointsEarned - firstBonus - shootoutBonus
}

export function isExactScorePoints(
  pointsEarned: number,
  firstBonus = 0,
  shootoutBonus = 0,
): boolean {
  return basePointsEarned(pointsEarned, firstBonus, shootoutBonus) === 5
}

export const SCORING_RULES = [
  { label: 'Exact score', points: 5, description: 'Predict the exact final score' },
  { label: 'Correct result', points: 2, description: 'Correct winner or draw (if not exact)' },
  { label: 'Correct goal difference', points: '+1', description: 'Same goal margin (if not exact)' },
  { label: "One team's goals", points: '+1', description: 'Either home or away goals correct (if not exact)' },
  {
    label: 'Shootout winner',
    points: '+2',
    description: 'Knockout tie you called a draw — pick who advances on penalties',
  },
  {
    label: 'Exact penalty score',
    points: '+1',
    description: 'Also nail the exact shootout score (e.g. 4–3)',
  },
  {
    label: 'Early bird',
    points: '+1',
    description:
      'First to submit a winning scoreline when others pick the same score (only if that pick earns points)',
  },
  {
    label: 'Tiebreaker',
    points: '—',
    description: 'Same total points? More early birds, then whoever predicted earlier ranks higher',
  },
] as const
