import type { Match } from './types'
import { isMatchLocked } from './matchUtils'

export type MealChallengeStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'settled'
  | 'cancelled'

export type MealChallengeWinCondition = 'exact_score' | 'correct_result' | 'correct_winner'

export type MealClaimOutcome = 'home_win' | 'away_win' | 'draw'

export type MealChallengeAcceptStatus = 'active' | 'won' | 'lost'

/** Meal bets use 1 pt only — keeps social stakes fun without swinging the leaderboard */
export const MEAL_CHALLENGE_POINT_STAKES = [1] as const
export type MealChallengePointStake = (typeof MEAL_CHALLENGE_POINT_STAKES)[number]

export function canAcceptMealBet(match: Match | undefined | null): boolean {
  return Boolean(match && !isMatchLocked(match))
}

export interface MealChallenge {
  id: string
  match_id: string
  creator_id: string
  claim_text: string
  stake_text: string
  backed_outcome: MealClaimOutcome
  win_condition: MealChallengeWinCondition
  status: MealChallengeStatus
  reject_reason: string | null
  approved_by: string | null
  approved_at: string | null
  winner_user_id: string | null
  winner_note: string | null
  settled_at: string | null
  settled_by: string | null
  created_at: string
  updated_at: string
}

export interface MealChallengeAcceptance {
  id: string
  challenge_id: string
  user_id: string
  points_staked: MealChallengePointStake
  status: MealChallengeAcceptStatus
  points_delta: number | null
  created_at: string
}

export interface MealChallengePick {
  user_id: string
  display_name: string
  home_pred: number
  away_pred: number
  created_at: string
}

export const MEAL_CHALLENGE_WIN_OPTIONS: {
  value: MealChallengeWinCondition
  label: string
  hint: string
}[] = [
  {
    value: 'exact_score',
    label: 'Exact score',
    hint: 'Perfect scoreline — earliest pick wins if more than one',
  },
  {
    value: 'correct_result',
    label: 'Correct result',
    hint: 'Right winner or draw — earliest pick wins ties',
  },
  {
    value: 'correct_winner',
    label: 'Correct winner',
    hint: 'Picked the winning team — earliest pick wins ties',
  },
]

export function formatAcceptorPick(
  homePred: number | null | undefined,
  awayPred: number | null | undefined,
): string {
  if (homePred == null || awayPred == null) return 'No pick yet'
  return `${homePred}-${awayPred}`
}

export function acceptorBetLine(input: {
  backedOutcome: MealClaimOutcome
  match?: Pick<Match, 'home_team' | 'away_team'>
  homePred?: number | null
  awayPred?: number | null
}): string {
  const pick = formatAcceptorPick(input.homePred, input.awayPred)
  const claim = mealClaimOutcomeLabel(input.backedOutcome, input.match)
  return `${pick} · vs ${claim}`
}

export function mealChallengeWinLabel(condition: MealChallengeWinCondition): string {
  return MEAL_CHALLENGE_WIN_OPTIONS.find((o) => o.value === condition)?.label ?? condition
}

function matchOutcome(home: number, away: number): MealClaimOutcome {
  if (home > away) return 'home_win'
  if (away > home) return 'away_win'
  return 'draw'
}

export function getMatchClaimOutcome(
  match: Pick<Match, 'home_score' | 'away_score' | 'status'>,
): MealClaimOutcome | null {
  if (match.status !== 'finished' || match.home_score === null || match.away_score === null) {
    return null
  }
  return matchOutcome(match.home_score, match.away_score)
}

export function isClaimCorrect(
  match: Pick<Match, 'home_score' | 'away_score' | 'status'>,
  backed: MealClaimOutcome,
): boolean {
  const actual = getMatchClaimOutcome(match)
  return actual !== null && actual === backed
}

export function mealClaimOutcomeLabel(
  outcome: MealClaimOutcome,
  match?: Pick<Match, 'home_team' | 'away_team'>,
): string {
  if (outcome === 'home_win') return match ? `${match.home_team} wins` : 'Home win'
  if (outcome === 'away_win') return match ? `${match.away_team} wins` : 'Away win'
  return 'Draw'
}

export function backedOutcomeOptions(
  match: Pick<Match, 'home_team' | 'away_team'>,
): { value: MealClaimOutcome; label: string }[] {
  return [
    { value: 'home_win', label: `${match.home_team} wins` },
    { value: 'away_win', label: `${match.away_team} wins` },
    { value: 'draw', label: 'Draw' },
  ]
}

function matchOutcomeForPicks(home: number, away: number): 'home' | 'away' | 'draw' {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

function pickOutcomeLegacy(homePred: number, awayPred: number): 'home' | 'away' | 'draw' {
  return matchOutcomeForPicks(homePred, awayPred)
}

export function findMealChallengeWinners(
  match: Pick<Match, 'home_score' | 'away_score' | 'status'>,
  picks: MealChallengePick[],
  condition: MealChallengeWinCondition,
): MealChallengePick[] {
  if (match.status !== 'finished' || match.home_score === null || match.away_score === null) {
    return []
  }

  const home = match.home_score
  const away = match.away_score
  const actual = matchOutcomeForPicks(home, away)

  const eligible = picks.filter((p) => {
    if (condition === 'exact_score') {
      return p.home_pred === home && p.away_pred === away
    }
    const predicted = pickOutcomeLegacy(p.home_pred, p.away_pred)
    if (condition === 'correct_result') {
      return predicted === actual
    }
    if (actual === 'draw') return predicted === 'draw'
    return predicted === actual
  })

  return eligible.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

export function formatMealChallengeHeadline(claim: string, stake: string): string {
  return `${claim.trim()} — or ${stake.trim()}`
}

export const MEAL_CHALLENGE_STAKE_EXAMPLES = [
  'Chicken mandi for whoever nails the exact score',
  'Zomato lunch (₹300) for the first correct result',
  'Biryani for anyone who picks the winner right',
  'Coffee on me for the closest predictor',
]
