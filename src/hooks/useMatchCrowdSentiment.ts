import { useCallback, useEffect, useState } from 'react'
import { parseCrowdSentimentRow, type CrowdSentiment } from '../lib/pickCrowdSentiment'
import { supabase } from '../lib/supabase'

export function useMatchCrowdSentiment(matchId: string | undefined, enabled: boolean) {
  const [sentiment, setSentiment] = useState<CrowdSentiment | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSentiment = useCallback(async () => {
    if (!matchId || !enabled) {
      setSentiment(null)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.rpc('get_match_crowd_sentiment', {
      match_uuid: matchId,
    })
    if (error || !data?.[0]) {
      setSentiment(null)
    } else {
      setSentiment(parseCrowdSentimentRow(data[0] as Parameters<typeof parseCrowdSentimentRow>[0]))
    }
    setLoading(false)
  }, [matchId, enabled])

  useEffect(() => {
    void fetchSentiment()
  }, [fetchSentiment])

  return { sentiment, loading, refetch: fetchSentiment }
}
