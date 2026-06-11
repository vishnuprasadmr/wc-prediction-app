import type { LeaderboardEntry, Match } from './types'

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
