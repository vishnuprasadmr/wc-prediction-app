import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { LeaderboardEntry } from '../lib/types'

export function useLeaderboard(stageFilter?: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setError(null)

    if (stageFilter && stageFilter !== 'all') {
      const { data, error: rpcError } = await supabase.rpc('get_leaderboard_by_stage', {
        stage_filter: stageFilter,
      })
      if (rpcError) {
        setError(rpcError.message)
      } else {
        setEntries((data as LeaderboardEntry[]) ?? [])
      }
    } else {
      const { data, error: viewError } = await supabase
        .from('leaderboard_view')
        .select('*')
        .order('rank', { ascending: true })

      if (viewError) {
        setError(viewError.message)
      } else {
        setEntries((data as LeaderboardEntry[]) ?? [])
      }
    }

    setLoading(false)
  }, [stageFilter])

  useEffect(() => {
    fetchLeaderboard()

    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, () => {
        fetchLeaderboard()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'season_predictions' }, () => {
        fetchLeaderboard()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeaderboard])

  return { entries, loading, error, refetch: fetchLeaderboard }
}
