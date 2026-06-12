import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface PickStatRow {
  home_pred: number
  away_pred: number
  pick_count: number
}

export function useMatchPickStats(matchId: string | undefined, enabled: boolean) {
  const [rows, setRows] = useState<PickStatRow[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    if (!matchId || !enabled) {
      setRows([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase.rpc('get_match_pick_stats', { match_uuid: matchId })
    setRows(error ? [] : ((data as PickStatRow[]) ?? []))
    setLoading(false)
  }, [matchId, enabled])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  return { rows, loading, refetch: fetchStats }
}
