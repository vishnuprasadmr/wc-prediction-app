import type { ShootoutChallengeView } from '../hooks/useShootoutChallenges'
import { heroShort } from './shootout/hero'
import { victoryTaunt } from './shootout/banter'
import { formatShareDateIst } from './timezone'
import { renderShootoutVictoryBlob } from './shareImage/renderShootoutVictoryCard'
import { shareStandings, type ShareResult } from './shareStandings'
import { downloadShareImage } from './shareDownload'

export interface ShootoutVictoryShareInput {
  winnerName: string
  loserName: string
  winnerAvatarUrl?: string | null
  loserAvatarUrl?: string | null
  winnerHeroLabel: string
  loserHeroLabel: string
  challengerScore: number
  opponentScore: number
  tauntLine: string
  dateLabel: string
}

export function buildShootoutVictoryInput(challenge: ShootoutChallengeView): ShootoutVictoryShareInput {
  const winnerId = challenge.winner_id
  const winnerIsChallenger = winnerId === challenge.challenger_id
  const winnerName = winnerIsChallenger ? challenge.challenger_name : challenge.opponent_name
  const loserName = winnerIsChallenger ? challenge.opponent_name : challenge.challenger_name

  return {
    winnerName,
    loserName,
    winnerAvatarUrl: winnerIsChallenger ? challenge.challenger_avatar : challenge.opponent_avatar,
    loserAvatarUrl: winnerIsChallenger ? challenge.opponent_avatar : challenge.challenger_avatar,
    winnerHeroLabel: heroShort(winnerIsChallenger ? challenge.challenger_hero : challenge.opponent_hero),
    loserHeroLabel: heroShort(winnerIsChallenger ? challenge.opponent_hero : challenge.challenger_hero),
    challengerScore: challenge.challenger_score,
    opponentScore: challenge.opponent_score,
    tauntLine: victoryTaunt(winnerName),
    dateLabel: formatShareDateIst(),
  }
}

export function buildShootoutVictoryShareText(input: ShootoutVictoryShareInput): string {
  return [
    '⚽ Simelabs WC 2026 — Arena victory',
    `${input.winnerName} (${input.winnerHeroLabel}) beats ${input.loserName} (${input.loserHeroLabel})`,
    `Shootout ${input.challengerScore}–${input.opponentScore}`,
    input.tauntLine,
    'Challenge me in the Arena!',
  ].join('\n')
}

export function prepareShootoutVictoryBlob(input: ShootoutVictoryShareInput): Promise<Blob> {
  return renderShootoutVictoryBlob(input)
}

export async function shareShootoutVictoryWithImage(
  input: ShootoutVictoryShareInput,
  preparedBlob?: Blob | null,
): Promise<ShareResult> {
  const text = buildShootoutVictoryShareText(input)
  try {
    const blob = preparedBlob ?? (await renderShootoutVictoryBlob(input))
    return shareStandings(text, blob)
  } catch {
    return shareStandings(text)
  }
}

export async function downloadShootoutVictoryImage(
  input: ShootoutVictoryShareInput,
  preparedBlob?: Blob | null,
): Promise<boolean> {
  try {
    const blob = preparedBlob ?? (await renderShootoutVictoryBlob(input))
    return downloadShareImage(blob, 'wc-arena-victory.png')
  } catch {
    return false
  }
}
