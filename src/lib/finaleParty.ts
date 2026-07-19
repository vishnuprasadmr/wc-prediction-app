import type { LeaderboardEntry, Match } from './types'

export type FinalePartyStatus = 'off' | 'anticipation' | 'published'

export type FinaleSlotKey =
  | 'champion'
  | 'runner_up'
  | 'bronze'
  | 'oracle'
  | 'season_star'
  | 'lucky_draw'

export interface FinalePartyConfig {
  status: FinalePartyStatus
  anticipation_headline: string
  anticipation_body: string
  published_headline: string
  published_body: string
  published_at: string | null
  updated_at?: string
}

/** Public award row (never includes full zomato_code). */
export interface FinalePrizeAwardPublic {
  id: string
  slot_key: FinaleSlotKey | string
  title: string
  amount_inr: number
  night_label: string | null
  user_id: string | null
  suggested_user_id: string | null
  revealed_at: string | null
  sort_order: number
  winner_display_name?: string | null
  winner_avatar_url?: string | null
  masked_card?: string | null
}

/** Admin-only row including gift code. */
export interface FinalePrizeAwardAdmin extends FinalePrizeAwardPublic {
  zomato_code: string | null
}

export interface FinaleSlotDef {
  slot_key: FinaleSlotKey
  title: string
  amount_inr: number
  suggestionHint: string
}

export const FINALE_SLOT_DEFS: FinaleSlotDef[] = [
  {
    slot_key: 'champion',
    title: 'Champion',
    amount_inr: 1500,
    suggestionHint: 'Leaderboard #1',
  },
  {
    slot_key: 'runner_up',
    title: 'Runner-up',
    amount_inr: 800,
    suggestionHint: 'Leaderboard #2',
  },
  {
    slot_key: 'bronze',
    title: 'Bronze',
    amount_inr: 500,
    suggestionHint: 'Leaderboard #3',
  },
  {
    slot_key: 'oracle',
    title: 'Oracle',
    amount_inr: 500,
    suggestionHint: 'Most exact scores',
  },
  {
    slot_key: 'season_star',
    title: 'Season specials star',
    amount_inr: 500,
    suggestionHint: 'Highest season bonus',
  },
  {
    slot_key: 'lucky_draw',
    title: 'Lucky league draw',
    amount_inr: 500,
    suggestionHint: '70%+ match picks',
  },
]

export const FINALE_POOL_TOTAL_INR = FINALE_SLOT_DEFS.reduce((s, d) => s + d.amount_inr, 0)

export function isFinalMatchFinished(matches: Match[]): boolean {
  return matches.some((m) => m.stage === 'Final' && m.status === 'finished')
}

/** Client phase: Final finished + not published ⇒ anticipation party. */
export function resolveFinaleHomePhase(
  matches: Match[],
  config: FinalePartyConfig | null,
): 'tournament' | 'anticipation' | 'published' {
  if (config?.status === 'published') return 'published'
  if (isFinalMatchFinished(matches)) return 'anticipation'
  return 'tournament'
}

export function finaleCelebrateStorageKey(publishedAt: string | null): string {
  return `wc-finale-celebrated:${publishedAt ?? 'none'}`
}

export interface FinaleSuggestions {
  bySlot: Partial<Record<FinaleSlotKey, string | null>>
  luckyEligibleIds: string[]
}

/**
 * Build admin suggestions from leaderboard + season bonuses + prediction counts.
 */
export function buildFinaleSuggestions(
  entries: LeaderboardEntry[],
  seasonBonuses: { user_id: string; points_earned: number | null }[],
  predictionCounts: { user_id: string; count: number }[],
  totalMatches: number,
): FinaleSuggestions {
  const bySlot: Partial<Record<FinaleSlotKey, string | null>> = {
    champion: entries[0]?.user_id ?? null,
    runner_up: entries[1]?.user_id ?? null,
    bronze: entries[2]?.user_id ?? null,
    oracle: null,
    season_star: null,
    lucky_draw: null,
  }

  if (entries.length > 0) {
    const oracle = [...entries].sort((a, b) => b.exact_scores - a.exact_scores)[0]
    bySlot.oracle = oracle?.user_id ?? null
  }

  if (seasonBonuses.length > 0) {
    const star = [...seasonBonuses].sort(
      (a, b) => (b.points_earned ?? 0) - (a.points_earned ?? 0),
    )[0]
    bySlot.season_star = star?.user_id ?? null
  }

  const threshold = totalMatches > 0 ? Math.ceil(totalMatches * 0.7) : 0
  const luckyEligibleIds = predictionCounts
    .filter((p) => p.count >= threshold && threshold > 0)
    .map((p) => p.user_id)

  return { bySlot, luckyEligibleIds }
}

export function awardsReadyToPublish(awards: FinalePrizeAwardAdmin[]): boolean {
  if (awards.length < FINALE_SLOT_DEFS.length) return false
  return awards.every((a) => Boolean(a.user_id) && Boolean(a.zomato_code?.trim()))
}

export function awardDisplayTitle(
  award: Pick<FinalePrizeAwardPublic, 'title' | 'night_label'>,
): string {
  if (award.night_label?.trim()) return `${award.title} · ${award.night_label.trim()}`
  return award.title
}

/** What a signed-in player should see on Home for the finale party. */
export function playerFinaleHomeMode(
  phase: 'tournament' | 'anticipation' | 'published',
  userId: string | null | undefined,
  awards: Pick<FinalePrizeAwardPublic, 'user_id'>[],
): 'hidden' | 'anticipation' | 'gift' | 'thanks' {
  if (phase === 'tournament') return 'hidden'
  if (phase === 'anticipation') return 'anticipation'
  if (!userId) return 'thanks'
  const won = awards.some((a) => a.user_id === userId)
  return won ? 'gift' : 'thanks'
}

/** Strip gift codes before any public/player-facing payload. */
export function toPublicAward(award: FinalePrizeAwardAdmin): FinalePrizeAwardPublic {
  return {
    id: award.id,
    slot_key: award.slot_key,
    title: award.title,
    amount_inr: award.amount_inr,
    night_label: award.night_label,
    user_id: award.user_id,
    suggested_user_id: award.suggested_user_id,
    revealed_at: award.revealed_at,
    sort_order: award.sort_order,
    winner_display_name: award.winner_display_name,
    winner_avatar_url: award.winner_avatar_url,
    masked_card: award.masked_card ?? maskGiftCardNumber(award.zomato_code),
  }
}

export function publicAwardsLeakCodes(awards: FinalePrizeAwardPublic[]): boolean {
  return awards.some(
    (a) => 'zomato_code' in a && Boolean((a as { zomato_code?: string }).zomato_code),
  )
}

/** Mask a stored Zomato card blob — shows first/last 4 of the 16-digit card only. */
export function maskGiftCardNumber(code: string | null | undefined): string | null {
  if (!code?.trim()) return null
  const digits = code.replace(/\D/g, '')
  if (digits.length >= 16) {
    const card = digits.slice(0, 16)
    return `${card.slice(0, 4)} **** **** ${card.slice(12)}`
  }
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)} **** ${digits.slice(-4)}`
  }
  return '****'
}
