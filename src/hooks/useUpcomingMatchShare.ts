import { useEffect, useState } from 'react'
import { buildUpcomingMatchShare, type UpcomingMatchShare } from '../lib/upcomingMatchStory'
import { fetchFifaMatchDetails } from '../lib/fifaMatchDetails'
import { fetchMatchPickPreview } from '../lib/fetchMatchPickPreview'
import type { Match } from '../lib/types'

export function useUpcomingMatchShare(match: Match | null) {
  const [share, setShare] = useState<UpcomingMatchShare | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!match) {
      setShare(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const [details, crowdSentiment] = await Promise.all([
          fetchFifaMatchDetails(match),
          fetchMatchPickPreview(match.id),
        ])
        if (cancelled) return
        setShare(buildUpcomingMatchShare(match, details, crowdSentiment))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load match preview')
        setShare(buildUpcomingMatchShare(match, null, null))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [match?.id, match?.api_fixture_id, match?.kickoff_at])

  return { share, loading, error }
}
