import { useCallback, useEffect, useState } from 'react'
import type { SeasonAnswers } from '../lib/seasonQuestions'
import { supabase } from '../lib/supabase'
import type { LeaderboardEntry } from '../lib/types'

export type HeartTeamMap = Record<string, string>

async function fetchHeartTeams(): Promise<HeartTeamMap> {
  const { data, error } = await supabase.from('season_predictions').select('user_id, answers')

  if (error) return {}

  const map: HeartTeamMap = {}
  for (const row of data ?? []) {
    const heart = (row.answers as SeasonAnswers | null)?.heart_team
    if (heart) map[row.user_id] = heart
  }
  return map
}

export function useLeaderboard(stageFilter?: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [heartTeams, setHeartTeams] = useState<HeartTeamMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setError(null)

    const [heartMap, leaderboardResult] = await Promise.all([
      fetchHeartTeams(),
      (async () => {
        if (stageFilter && stageFilter !== 'all') {
          return supabase.rpc('get_leaderboard_by_stage', { stage_filter: stageFilter })
        }
        return supabase.from('leaderboard_view').select('*').order('rank', { ascending: true })
      })(),
    ])

    setHeartTeams(heartMap)

    if (leaderboardResult.error) {
      setError(leaderboardResult.error.message)
    } else {
      setEntries((leaderboardResult.data as LeaderboardEntry[]) ?? [])
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

  return { entries, heartTeams, loading, error, refetch: fetchLeaderboard }
}
