import { useEffect, useMemo, useState } from 'react'
import type { Match } from '../lib/types'
import { shouldFetchFifaLive } from '../lib/matchUtils'
import { fetchFifaLiveMap, mergeMatchesWithFifaLive } from '../lib/fifaLive'

const POLL_MS = 30_000

/**
 * Fetches FIFA scores directly in the browser (no edge function needed for display).
 * Merges into match list so Live scoreboard updates even before DB sync runs.
 */
export function useFifaLiveOverlay(matches: Match[]) {
  const [liveMap, setLiveMap] = useState<Awaited<ReturnType<typeof fetchFifaLiveMap>> | null>(
    null,
  )
  const [fetchError, setFetchError] = useState<string | null>(null)

  const pollActive = shouldFetchFifaLive(matches)

  useEffect(() => {
    if (!pollActive) {
      setLiveMap(null)
      setFetchError(null)
      return undefined
    }

    let cancelled = false

    const run = async () => {
      try {
        const map = await fetchFifaLiveMap()
        if (!cancelled) {
          setLiveMap(map)
          setFetchError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : 'FIFA fetch failed')
        }
      }
    }

    void run()
    const id = window.setInterval(run, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [pollActive])

  const displayMatches = useMemo(() => {
    if (!liveMap || liveMap.size === 0) return matches
    return mergeMatchesWithFifaLive(matches, liveMap)
  }, [matches, liveMap])

  return { displayMatches, fetchError, fifaLiveActive: pollActive && liveMap !== null }
}
