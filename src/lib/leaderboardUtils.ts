import type { Match } from './types'

/** Rankings only make sense after at least one match in scope has finished */
export function hasFinishedMatches(matches: Match[], stageFilter = 'all'): boolean {
  return matches.some((m) => {
    if (m.status !== 'finished') return false
    if (stageFilter === 'all') return true
    return m.stage === stageFilter
  })
}
