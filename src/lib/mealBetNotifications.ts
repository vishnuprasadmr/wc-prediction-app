import type { Match } from './types'
import { isMatchLocked } from './matchUtils'

const NOTIFY_PREFIX = 'wc-meal-notify:'
const SETTLE_NOTIFY_PREFIX = 'wc-meal-settle-notify:'
const SEEN_PREFIX = 'wc-meal-seen:'

const ACCEPT_NOTIFY_PREFIX = 'wc-meal-accept-notify:'

export function wasMealAcceptNotified(acceptanceId: string): boolean {
  try {
    return localStorage.getItem(`${ACCEPT_NOTIFY_PREFIX}${acceptanceId}`) === '1'
  } catch {
    return false
  }
}

export function markMealAcceptNotified(acceptanceId: string): void {
  try {
    localStorage.setItem(`${ACCEPT_NOTIFY_PREFIX}${acceptanceId}`, '1')
  } catch {
    /* ignore */
  }
}

export function wasMealBetNotified(challengeId: string): boolean {
  try {
    return localStorage.getItem(`${NOTIFY_PREFIX}${challengeId}`) === '1'
  } catch {
    return false
  }
}

export function markMealBetNotified(challengeId: string): void {
  try {
    localStorage.setItem(`${NOTIFY_PREFIX}${challengeId}`, '1')
  } catch {
    /* ignore */
  }
}

export function wasMealSettleNotified(challengeId: string): boolean {
  try {
    return localStorage.getItem(`${SETTLE_NOTIFY_PREFIX}${challengeId}`) === '1'
  } catch {
    return false
  }
}

export function markMealSettleNotified(challengeId: string): void {
  try {
    localStorage.setItem(`${SETTLE_NOTIFY_PREFIX}${challengeId}`, '1')
  } catch {
    /* ignore */
  }
}

export function isMealBetSeen(challengeId: string): boolean {
  try {
    return localStorage.getItem(`${SEEN_PREFIX}${challengeId}`) === '1'
  } catch {
    return false
  }
}

export function markMealBetSeen(challengeId: string): void {
  try {
    localStorage.setItem(`${SEEN_PREFIX}${challengeId}`, '1')
  } catch {
    /* ignore */
  }
}

export function markAllMealBetsSeen(challengeIds: string[]): void {
  for (const id of challengeIds) {
    markMealBetSeen(id)
  }
}

export interface MealBetBadgeInput {
  id: string
  creator_id: string
  match?: Pick<Match, 'kickoff_at' | 'status'>
  acceptances: { user_id: string }[]
}

export function isActionableMealBet(
  challenge: MealBetBadgeInput,
  userId: string,
): boolean {
  if (challenge.creator_id === userId) return false
  if (challenge.acceptances.some((a) => a.user_id === userId)) return false
  if (!challenge.match) return false
  return !isMatchLocked(challenge.match as Match)
}

export function getOpenMealBetsForUser<T extends MealBetBadgeInput>(
  live: T[],
  userId: string,
): T[] {
  return live.filter((c) => isActionableMealBet(c, userId))
}

export function countUnseenActionableMealBets(
  live: MealBetBadgeInput[],
  userId: string,
): number {
  return live.filter(
    (c) => isActionableMealBet(c, userId) && !isMealBetSeen(c.id),
  ).length
}
