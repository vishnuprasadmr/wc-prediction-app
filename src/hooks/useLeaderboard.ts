import { useCallback, useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { SeasonAnswers } from '../lib/seasonQuestions'
import { supabase } from '../lib/supabase'
import type { LeaderboardEntry } from '../lib/types'

export type HeartTeamMap = Record<string, string>

interface LeaderboardCache {
  entries: LeaderboardEntry[]
  heartTeams: HeartTeamMap
}

const leaderboardCache = new Map<string, LeaderboardCache>()

function cacheKey(stageFilter?: string): string {
  return stageFilter && stageFilter !== 'all' ? stageFilter : 'all'
}

/** One realtime channel shared across all useLeaderboard() callers. */
const leaderboardListeners = new Set<() => void>()
let leaderboardChannel: RealtimeChannel | null = null

function notifyLeaderboardListeners() {
  for (const listener of leaderboardListeners) {
    listener()
  }
}

function attachLeaderboardRealtime(listener: () => void) {
  leaderboardListeners.add(listener)

  if (!leaderboardChannel) {
    leaderboardChannel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, () => {
        notifyLeaderboardListeners()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'season_predictions' }, () => {
        notifyLeaderboardListeners()
      })
      .subscribe()
  }

  return () => {
    leaderboardListeners.delete(listener)
    if (leaderboardListeners.size === 0 && leaderboardChannel) {
      void supabase.removeChannel(leaderboardChannel)
      leaderboardChannel = null
    }
  }
}

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
  const key = cacheKey(stageFilter)
  const cached = leaderboardCache.get(key)

  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => cached?.entries ?? [])
  const [heartTeams, setHeartTeams] = useState<HeartTeamMap>(() => cached?.heartTeams ?? {})
  const [loading, setLoading] = useState(() => !cached)
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
      const nextEntries = (leaderboardResult.data as LeaderboardEntry[]) ?? []
      setEntries(nextEntries)
      leaderboardCache.set(key, { entries: nextEntries, heartTeams: heartMap })
    }

    setLoading(false)
  }, [stageFilter, key])

  useEffect(() => {
    const hit = leaderboardCache.get(key)
    if (hit) {
      setEntries(hit.entries)
      setHeartTeams(hit.heartTeams)
      setLoading(false)
    } else {
      setLoading(true)
    }
    void fetchLeaderboard()
    return attachLeaderboardRealtime(fetchLeaderboard)
  }, [fetchLeaderboard, key])

  return { entries, heartTeams, loading, error, refetch: fetchLeaderboard }
}
