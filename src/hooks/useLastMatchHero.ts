import { useEffect, useMemo, useState } from 'react'
import { fetchFifaMatchDetails } from '../lib/fifaMatchDetails'
import { buildMatchHero, type MatchHeroShare } from '../lib/matchHeroStory'
import { getLastFinishedMatch } from '../lib/matchUtils'
import type { Match } from '../lib/types'

export function useLastMatchHero(matches: Match[]) {
  const lastMatch = useMemo(() => getLastFinishedMatch(matches), [matches])
  const [hero, setHero] = useState<MatchHeroShare | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lastMatch) {
      setHero(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const details = await fetchFifaMatchDetails(lastMatch)
        if (cancelled) return
        setHero(buildMatchHero(lastMatch, details))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load match story')
        setHero(buildMatchHero(lastMatch, null))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    lastMatch?.id,
    lastMatch?.home_score,
    lastMatch?.away_score,
    lastMatch?.status,
    lastMatch?.api_fixture_id,
  ])

  return { lastMatch, hero, loading, error }
}
