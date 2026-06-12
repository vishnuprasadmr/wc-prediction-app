import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PredictionWithMatch } from '../lib/types'

const predictionsCache = new Map<string, PredictionWithMatch[]>()

export function useUserPredictions(userId?: string) {
  const cached = userId ? predictionsCache.get(userId) : undefined

  const [predictions, setPredictions] = useState<PredictionWithMatch[]>(() => cached ?? [])
  const [loading, setLoading] = useState(() => !cached)

  const fetchPredictions = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    if (!predictionsCache.has(userId)) {
      setLoading(true)
    }

    const { data, error } = await supabase
      .from('predictions')
      .select('*, match:matches(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const next = data as unknown as PredictionWithMatch[]
      setPredictions(next)
      predictionsCache.set(userId, next)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void fetchPredictions()
  }, [fetchPredictions])

  return { predictions, loading, refetch: fetchPredictions }
}
