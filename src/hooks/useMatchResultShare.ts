import { useEffect, useState } from 'react'
import { buildMatchResultShare, type MatchResultShare } from '../lib/matchResultStory'
import { fetchFifaMatchDetails } from '../lib/fifaMatchDetails'
import type { Match } from '../lib/types'

export function useMatchResultShare(match: Match | null) {
  const [result, setResult] = useState<MatchResultShare | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!match) {
      setResult(null)
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
        setResult(buildMatchResultShare(match, details))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load match')
        setResult(buildMatchResultShare(match, null))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [match?.id, match?.api_fixture_id, match?.status])

  return { result, loading, error }
}
