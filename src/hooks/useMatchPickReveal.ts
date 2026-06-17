import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface PickRevealRow {
  display_name: string
  home_pred: number
  away_pred: number
  avatar_url: string | null
}

export function useMatchPickReveal(matchId: string | undefined, enabled: boolean) {
  const [rows, setRows] = useState<PickRevealRow[]>([])
  const [loading, setLoading] = useState(false)

  const fetchReveal = useCallback(async () => {
    if (!matchId || !enabled) {
      setRows([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase.rpc('get_match_pick_reveal', { match_uuid: matchId })
    setRows(error ? [] : ((data as PickRevealRow[]) ?? []))
    setLoading(false)
  }, [matchId, enabled])

  useEffect(() => {
    void fetchReveal()
  }, [fetchReveal])

  return { rows, loading, refetch: fetchReveal }
}
