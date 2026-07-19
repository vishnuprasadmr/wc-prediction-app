import {
  awardDisplayTitle,
  maskGiftCardNumber,
  type FinalePrizeAwardAdmin,
  type FinalePrizeAwardPublic,
} from './finaleParty'
import { formatInr } from './prizes'
import type { PrizeWinnerShareInput } from './shareImage/prizeWinnerTypes'
import { renderPrizeWinnerBlob } from './shareImage/renderPrizeWinnerCard'
import { downloadShareImage } from './shareDownload'
import { shareStandings, type ShareResult } from './shareStandings'
import { formatShareDateIst } from './timezone'

export type { PrizeWinnerShareInput }

export function buildPrizeWinnerInput(
  award: FinalePrizeAwardPublic | FinalePrizeAwardAdmin,
): PrizeWinnerShareInput {
  const adminCode = 'zomato_code' in award ? award.zomato_code : null
  return {
    prizeTitle: awardDisplayTitle(award),
    winnerName: award.winner_display_name?.trim() || 'Winner',
    winnerAvatarUrl: award.winner_avatar_url ?? null,
    amountInr: award.amount_inr,
    amountLabel: formatInr(award.amount_inr),
    maskedCard: award.masked_card ?? maskGiftCardNumber(adminCode),
    dateLabel: formatShareDateIst(),
  }
}

export function buildPrizeWinnerShareText(input: PrizeWinnerShareInput): string {
  return [
    '🍽️ Simelabs WC 2026 — Prize winner',
    `${input.prizeTitle}: ${input.winnerName}`,
    `${input.amountLabel} Zomato e-gift card`,
    input.maskedCard ? `Card ${input.maskedCard}` : null,
    'Full code unlocked by the winner in the app.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function preparePrizeWinnerBlob(input: PrizeWinnerShareInput): Promise<Blob> {
  return renderPrizeWinnerBlob(input)
}

export async function sharePrizeWinnerWithImage(
  input: PrizeWinnerShareInput,
  preparedBlob?: Blob | null,
): Promise<ShareResult> {
  const text = buildPrizeWinnerShareText(input)
  try {
    const blob = preparedBlob ?? (await renderPrizeWinnerBlob(input))
    return shareStandings(text, blob)
  } catch {
    return shareStandings(text)
  }
}

export async function downloadPrizeWinnerImage(
  input: PrizeWinnerShareInput,
  preparedBlob?: Blob | null,
): Promise<boolean> {
  try {
    const blob = preparedBlob ?? (await renderPrizeWinnerBlob(input))
    const safe = input.prizeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
    return downloadShareImage(blob, `wc-prize-${safe || 'winner'}.png`)
  } catch {
    return false
  }
}
