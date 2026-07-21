import {
  awardDisplayTitle,
  FINALE_POOL_TOTAL_INR,
  type FinalePrizeAwardAdmin,
  type FinalePrizeAwardPublic,
} from './finaleParty'
import { formatInr } from './prizes'
import type { WinnersBoardShareInput } from './shareImage/winnersBoardTypes'
import { renderWinnersBoardBlob } from './shareImage/renderWinnersBoardCard'
import { downloadShareImage } from './shareDownload'
import { shareStandings, type ShareResult } from './shareStandings'
import { formatShareDateIst } from './timezone'

export type { WinnersBoardShareInput }

function badgeForSlot(slotKey: string, nightLabel: string | null, title: string): string {
  if (slotKey === 'lucky_draw' || nightLabel === 'Global') return 'Global lucky'
  if (slotKey === 'lucky_draw_simelabs' || nightLabel === 'Simelabs') return 'Simelabs lucky'
  if (slotKey === 'champion') return 'Champion'
  if (slotKey === 'runner_up') return 'Runner-up'
  if (slotKey === 'bronze') return 'Bronze'
  if (slotKey === 'oracle') return 'Oracle'
  if (slotKey === 'season_star') return 'Season star'
  return title
}

export function buildWinnersBoardInput(
  awards: Array<FinalePrizeAwardPublic | FinalePrizeAwardAdmin>,
): WinnersBoardShareInput {
  const winners = awards
    .filter((a) => a.user_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((a) => ({
      prizeTitle: awardDisplayTitle(a),
      winnerName: a.winner_display_name?.trim() || 'Winner',
      winnerAvatarUrl: a.winner_avatar_url ?? null,
      amountLabel: formatInr(a.amount_inr),
      badge: badgeForSlot(String(a.slot_key), a.night_label, a.title),
    }))

  return {
    headline: 'Tournament honours',
    poolLabel: `${formatInr(FINALE_POOL_TOTAL_INR)} Zomato gift pool`,
    dateLabel: formatShareDateIst(),
    winners,
  }
}

export function buildWinnersBoardShareText(input: WinnersBoardShareInput): string {
  const lines = [
    '🍽️ Simelabs WC 2026 — Prize winners',
    input.poolLabel,
    '',
    ...input.winners.map((w) => `${w.prizeTitle}: ${w.winnerName} · ${w.amountLabel}`),
  ]
  return lines.join('\n')
}

export async function shareWinnersBoardWithImage(
  input: WinnersBoardShareInput,
  preparedBlob?: Blob | null,
): Promise<ShareResult> {
  const text = buildWinnersBoardShareText(input)
  try {
    const blob = preparedBlob ?? (await renderWinnersBoardBlob(input))
    return shareStandings(text, blob)
  } catch {
    return shareStandings(text)
  }
}

export async function downloadWinnersBoardImage(
  input: WinnersBoardShareInput,
  preparedBlob?: Blob | null,
): Promise<boolean> {
  try {
    const blob = preparedBlob ?? (await renderWinnersBoardBlob(input))
    return downloadShareImage(blob, 'wc-prize-winners-board.png')
  } catch {
    return false
  }
}

export function prepareWinnersBoardBlob(input: WinnersBoardShareInput): Promise<Blob> {
  return renderWinnersBoardBlob(input)
}
