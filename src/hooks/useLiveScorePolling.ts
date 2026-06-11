import { useEffect, useRef, useState } from 'react'
import type { Match } from '../lib/types'
import { shouldPollLiveScores } from '../lib/matchUtils'
import { syncDueMatchScores } from '../lib/liveScoreSync'

const POLL_MS_LIVE = 45_000
const POLL_MS_IDLE = 5 * 60_000

/**
 * Calls the sync-scores edge function while matches are live / just finished,
 * then runs onSynced so Supabase data (and points) stay current.
 */
export function useLiveScorePolling(
  matches: Match[],
  onSynced: () => Promise<void>,
) {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const runningRef = useRef(false)

  const pollActive = shouldPollLiveScores(matches)

  useEffect(() => {
    if (!pollActive) return undefined

    const run = async () => {
      if (runningRef.current) return
      runningRef.current = true
      setSyncing(true)
      try {
        await syncDueMatchScores()
        setLastSyncedAt(Date.now())
        await onSynced()
      } catch {
        /* edge function may not be deployed — app still works from DB */
      } finally {
        runningRef.current = false
        setSyncing(false)
      }
    }

    void run()
    const id = window.setInterval(run, POLL_MS_LIVE)
    return () => window.clearInterval(id)
  }, [pollActive, onSynced])

  useEffect(() => {
    if (pollActive) return undefined

    const id = window.setInterval(() => {
      void onSynced()
    }, POLL_MS_IDLE)

    return () => window.clearInterval(id)
  }, [pollActive, onSynced])

  return { syncing, lastSyncedAt, pollActive }
}
