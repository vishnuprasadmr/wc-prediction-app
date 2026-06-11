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

/** Base match points before early-bird bonus (stored in DB separately as first_bonus) */
export function basePointsEarned(pointsEarned: number, firstBonus = 0): number {
  return pointsEarned - firstBonus
}

export function isExactScorePoints(pointsEarned: number, firstBonus = 0): boolean {
  return basePointsEarned(pointsEarned, firstBonus) === 5
}

export const SCORING_RULES = [
  { label: 'Exact score', points: 5, description: 'Predict the exact final score' },
  { label: 'Correct result', points: 2, description: 'Correct winner or draw (if not exact)' },
  { label: 'Correct goal difference', points: '+1', description: 'Same goal margin (if not exact)' },
  { label: "One team's goals", points: '+1', description: 'Either home or away goals correct (if not exact)' },
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
