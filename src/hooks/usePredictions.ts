import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PredictionWithMatch } from '../lib/types'

export function useUserPredictions(userId?: string) {
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPredictions = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('predictions')
      .select('*, match:matches(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPredictions(data as unknown as PredictionWithMatch[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchPredictions()
  }, [fetchPredictions])

  return { predictions, loading, refetch: fetchPredictions }
}
