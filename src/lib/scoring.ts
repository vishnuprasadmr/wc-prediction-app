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

export const SCORING_RULES = [
  { label: 'Exact score', points: 5, description: 'Predict the exact final score' },
  { label: 'Correct result', points: 2, description: 'Correct winner or draw (if not exact)' },
  { label: 'Correct goal difference', points: '+1', description: 'Same goal margin (if not exact)' },
  { label: "One team's goals", points: '+1', description: 'Either home or away goals correct (if not exact)' },
] as const
