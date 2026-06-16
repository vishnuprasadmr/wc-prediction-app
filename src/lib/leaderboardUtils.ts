import type { LeaderboardEntry, Match } from './types'
import { isSimelabsLeaderboardEntry } from './employeeId'

export type LeaderboardLeague = 'global' | 'simelabs'

export type LeaderboardSortKey = 'rank' | 'points' | 'exact' | 'name'

export interface PlayerGaps {
  behindLeader: number
  aheadOfNext: number | null
  behindAbove: number | null
  playerAbove: LeaderboardEntry | null
  playerBelow: LeaderboardEntry | null
}

/** Rankings only make sense after at least one match in scope has finished */
export function hasFinishedMatches(matches: Match[], stageFilter = 'all'): boolean {
  return matches.some((m) => {
    if (m.status !== 'finished') return false
    if (stageFilter === 'all') return true
    return m.stage === stageFilter
  })
}

/** Pre-tournament roster — alphabetical, no competitive ordering */
export function sortPlayersAlphabetically(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) =>
    a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' }),
  )
}

export function filterLeaderboardBySearch(
  entries: LeaderboardEntry[],
  query: string,
): LeaderboardEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter((e) => e.display_name.toLowerCase().includes(q))
}

export function sortLeaderboardEntries(
  entries: LeaderboardEntry[],
  sortKey: LeaderboardSortKey,
): LeaderboardEntry[] {
  const copy = [...entries]
  switch (sortKey) {
    case 'points':
      return copy.sort((a, b) => b.total_points - a.total_points || a.rank - b.rank)
    case 'exact':
      return copy.sort(
        (a, b) =>
          b.exact_scores - a.exact_scores ||
          b.total_points - a.total_points ||
          a.rank - b.rank,
      )
    case 'name':
      return copy.sort((a, b) =>
        a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' }),
      )
    default:
      return copy.sort((a, b) => a.rank - b.rank)
  }
}

export function computePlayerGaps(
  entry: LeaderboardEntry,
  entries: LeaderboardEntry[],
): PlayerGaps {
  const sorted = [...entries].sort((a, b) => a.rank - b.rank)
  const leader = sorted[0]
  const index = sorted.findIndex((e) => e.user_id === entry.user_id)
  const above = index > 0 ? sorted[index - 1]! : null
  const below = index >= 0 && index < sorted.length - 1 ? sorted[index + 1]! : null

  return {
    behindLeader: leader ? Math.max(0, leader.total_points - entry.total_points) : 0,
    aheadOfNext: below ? entry.total_points - below.total_points : null,
    behindAbove: above ? above.total_points - entry.total_points : null,
    playerAbove: above,
    playerBelow: below,
  }
}

export function filterLeaderboardByLeague(
  entries: LeaderboardEntry[],
  league: LeaderboardLeague,
): LeaderboardEntry[] {
  const filtered =
    league === 'simelabs' ? entries.filter(isSimelabsLeaderboardEntry) : entries
  return filtered.map((entry, index) => ({ ...entry, rank: index + 1 }))
}
