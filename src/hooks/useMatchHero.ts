import { useEffect, useState } from 'react'
import { fetchFifaMatchDetails } from '../lib/fifaMatchDetails'
import { buildMatchHero, type MatchHeroShare } from '../lib/matchHeroStory'
import type { Match } from '../lib/types'

export function useMatchHero(match: Match | null) {
  const [hero, setHero] = useState<MatchHeroShare | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!match) {
      setHero(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const details = await fetchFifaMatchDetails(match)
        if (cancelled) return
        setHero(buildMatchHero(match, details))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load match story')
        setHero(buildMatchHero(match, null))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [match?.id, match?.api_fixture_id, match?.status])

  return { hero, loading, error }
}
