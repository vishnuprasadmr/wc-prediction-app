import { getDailyLeaderPrompt } from './dailyLeaderPrompt'
import type { LeaderboardEntry } from './types'

function firstName(displayName: string): string {
  const trimmed = displayName.trim()
  if (!trimmed) return 'the leader'
  return trimmed.split(/\s+/)[0] ?? trimmed
}

/** Personalized chase-the-leader line for in-app banners. */
export function buildLeaderNarrative(
  entries: LeaderboardEntry[],
  now = Date.now(),
): string | null {
  if (entries.length < 2) return null

  const leader = entries[0]!
  const second = entries[1]!
  const gap = leader.total_points - second.total_points
  const leaderFirst = firstName(leader.display_name)
  const daily = getDailyLeaderPrompt(now)

  if (gap <= 0) {
    return `${leader.display_name} and ${second.display_name} are tied at the top — ${daily}`
  }

  if (gap === 1) {
    return `${leaderFirst} leads by a single point — one exact score could flip it.`
  }

  if (gap <= 5) {
    return `Can anyone catch ${leaderFirst}? Only ${gap} pts separate #1 and #2.`
  }

  if (gap <= 12) {
    return `${leaderFirst} is +${gap} clear. ${daily}`
  }

  return `${leaderFirst} leads by ${gap} pts — the chasing pack needs a miracle matchday.`
}
