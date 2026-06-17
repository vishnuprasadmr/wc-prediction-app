import type { MealChallengeView } from '../hooks/useMealChallenges'
import { creatorOwesMealFulfillment } from './mealFulfillment'
import {
  mealChallengeWinLabel,
  mealClaimOutcomeLabel,
} from './mealChallenges'
import { renderMealChallengeBlob } from './shareImage/renderMealChallengeCard'
import { renderMealFulfillmentBlob } from './shareImage/renderMealFulfillmentCard'
import type {
  MealChallengeCardInput,
  MealChallengeShare,
  MealChallengeShareMode,
} from './shareImage/mealChallengeTypes'
import { shareStandings, type ShareResult } from './shareStandings'
import { downloadShareImage } from './shareDownload'
import { formatShareDateIst, formatKickoffIst } from './timezone'

export type { MealChallengeShare, MealChallengeShareMode } from './shareImage/mealChallengeTypes'

export function buildMealChallengeShare(
  challenge: MealChallengeView,
  mode: MealChallengeShareMode,
): MealChallengeShare {
  const match = challenge.match
  const hasScore =
    match?.home_score !== null &&
    match?.home_score !== undefined &&
    match?.away_score !== null &&
    match?.away_score !== undefined

  return {
    mode,
    homeTeam: match?.home_team ?? 'Home',
    awayTeam: match?.away_team ?? 'Away',
    kickoffLabel: match ? formatKickoffIst(match.kickoff_at) : '',
    scoreLabel: hasScore ? `${match!.home_score}–${match!.away_score}` : undefined,
    creatorName: challenge.creator_name,
    claimText: challenge.claim_text,
    stakeText: challenge.stake_text,
    claimLabel: mealClaimOutcomeLabel(challenge.backed_outcome, match),
    winConditionLabel: mealChallengeWinLabel(challenge.win_condition),
    acceptorsCount: challenge.acceptances.length,
    totalPointsStaked: challenge.total_points_staked,
    winnerName: challenge.winner_name,
    winnerNote: challenge.winner_note,
    ctaLine:
      mode === 'live'
        ? 'Head to Meal bets — accept & stake league points'
        : 'Meal challenge settled · Zomato treats & office lunches',
    badge: mode === 'live' ? 'MEAL BET' : 'MEAL WINNER',
  }
}

export function buildMealChallengeShareText(share: MealChallengeShare): string {
  const lines = [
    share.mode === 'live' ? '🍽️ Simelabs WC 2026 — Meal bet' : '🍽️ Simelabs WC 2026 — Meal winner',
    `${share.homeTeam} vs ${share.awayTeam}`,
  ]

  if (share.scoreLabel) lines.push(`Final: ${share.scoreLabel}`)
  else if (share.kickoffLabel) lines.push(`Kickoff: ${share.kickoffLabel}`)

  lines.push(
    '',
    `${share.creatorName} says: “${share.claimText}”`,
    `Claim: ${share.claimLabel}`,
    `Or else: ${share.stakeText}`,
    `Meal goes to: ${share.winConditionLabel}`,
  )

  if (share.mode === 'live' && share.acceptorsCount > 0) {
    lines.push(`${share.acceptorsCount} colleague(s) accepted · ${share.totalPointsStaked} pts on the line`)
  }

  if (share.mode === 'result') {
    lines.push('')
    if (share.winnerName) {
      lines.push(`🎉 ${share.winnerName} wins the meal!`)
    } else {
      lines.push(share.winnerNote ?? 'No meal winner this time')
    }
  }

  lines.push('', share.ctaLine, '', 'Join the league · Predict every match')
  return lines.join('\n')
}

export function buildMealFulfillmentShare(challenge: MealChallengeView): MealChallengeShare | null {
  if (!creatorOwesMealFulfillment(challenge, challenge.match)) return null

  const match = challenge.match
  const hasScore =
    match?.home_score !== null &&
    match?.home_score !== undefined &&
    match?.away_score !== null &&
    match?.away_score !== undefined

  const acceptorsWon = challenge.acceptances.filter((a) => (a.points_delta ?? 0) > 0).length

  return {
    mode: 'fulfillment',
    homeTeam: match?.home_team ?? 'Home',
    awayTeam: match?.away_team ?? 'Away',
    kickoffLabel: match ? formatKickoffIst(match.kickoff_at) : '',
    scoreLabel: hasScore ? `${match!.home_score}–${match!.away_score}` : undefined,
    creatorName: challenge.creator_name,
    claimText: challenge.claim_text,
    stakeText: challenge.stake_text,
    claimLabel: mealClaimOutcomeLabel(challenge.backed_outcome, match),
    winConditionLabel: mealChallengeWinLabel(challenge.win_condition),
    acceptorsCount: challenge.acceptances.length,
    totalPointsStaked: challenge.total_points_staked,
    winnerName: challenge.winner_name,
    winnerNote: challenge.winner_note,
    photoUrl: challenge.fulfillment_photo_url,
    acceptorsWonCount: acceptorsWon,
    ctaLine: 'I lost the bet — meal delivered 🍽️',
    badge: 'MEAL PAID',
  }
}

export function buildMealFulfillmentShareText(share: MealChallengeShare): string {
  const lines = [
    '🍽️ Simelabs WC 2026 — Meal bet paid up',
    `${share.homeTeam} vs ${share.awayTeam}`,
  ]

  if (share.scoreLabel) lines.push(`Final: ${share.scoreLabel}`)
  lines.push(
    '',
    `${share.creatorName} lost the claim “${share.claimText}”`,
    `Paid: ${share.stakeText}`,
  )

  if (share.winnerName) {
    lines.push(`Meal for ${share.winnerName}`)
  } else if (share.acceptorsWonCount) {
    lines.push(`${share.acceptorsWonCount} colleague(s) won +1 pt each`)
  }

  lines.push('', share.ctaLine, '', 'Join the league · Predict every match')
  return lines.join('\n')
}

function toCardInput(share: MealChallengeShare): MealChallengeCardInput {
  return { share, dateLabel: formatShareDateIst() }
}

export function prepareMealChallengeBlob(share: MealChallengeShare): Promise<Blob> {
  if (share.mode === 'fulfillment') {
    return renderMealFulfillmentBlob(toCardInput(share))
  }
  return renderMealChallengeBlob(toCardInput(share))
}

export async function shareMealFulfillmentWithImage(
  challenge: MealChallengeView,
  preparedBlob?: Blob | null,
): Promise<ShareResult> {
  const share = buildMealFulfillmentShare(challenge)
  if (!share) {
    return { ok: false }
  }
  const text = buildMealFulfillmentShareText(share)
  try {
    const blob = preparedBlob ?? (await renderMealFulfillmentBlob(toCardInput(share)))
    return shareStandings(text, blob)
  } catch {
    return shareStandings(text)
  }
}

export async function shareMealChallengeWithImage(
  share: MealChallengeShare,
  preparedBlob?: Blob | null,
): Promise<ShareResult> {
  const text = buildMealChallengeShareText(share)
  try {
    const blob = preparedBlob ?? (await renderMealChallengeBlob(toCardInput(share)))
    return shareStandings(text, blob)
  } catch {
    return shareStandings(text)
  }
}

export async function downloadMealChallengeImage(
  share: MealChallengeShare,
  preparedBlob?: Blob | null,
): Promise<boolean> {
  try {
    const blob = preparedBlob ?? (await prepareMealChallengeBlob(share))
    const name =
      share.mode === 'live'
        ? 'wc-meal-bet-share.png'
        : share.mode === 'fulfillment'
          ? 'wc-meal-paid-share.png'
          : 'wc-meal-winner-share.png'
    return downloadShareImage(blob, name)
  } catch {
    return false
  }
}
