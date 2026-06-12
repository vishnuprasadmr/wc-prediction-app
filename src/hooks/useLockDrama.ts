import { useEffect, useMemo, useRef } from 'react'
import { useMatches } from './useMatches'
import { vibrateLockUrgent } from '../lib/haptics'
import {
  getMsUntilPredictionLock,
  getPredictableMatches,
  LOCK_URGENT_MINUTES,
} from '../lib/matchUtils'

const VIBRATE_PREFIX = 'wc-lock-vibrate:'

function wasVibrated(matchId: string): boolean {
  try {
    return sessionStorage.getItem(`${VIBRATE_PREFIX}${matchId}`) === '1'
  } catch {
    return false
  }
}

function markVibrated(matchId: string): void {
  try {
    sessionStorage.setItem(`${VIBRATE_PREFIX}${matchId}`, '1')
  } catch {
    /* ignore */
  }
}

export function useLockDrama() {
  const { matches, predictions, loading } = useMatches()
  const lastVibrateRef = useRef(0)

  const urgentUnpickedCount = useMemo(() => {
    const urgentMs = LOCK_URGENT_MINUTES * 60 * 1000
    return getPredictableMatches(matches).filter((m) => {
      if (predictions[m.id]) return false
      const ms = getMsUntilPredictionLock(m.kickoff_at)
      return ms > 0 && ms <= urgentMs
    }).length
  }, [matches, predictions])

  useEffect(() => {
    if (loading || urgentUnpickedCount === 0) return undefined

    const open = getPredictableMatches(matches).filter((m) => !predictions[m.id])
    const urgentMs = LOCK_URGENT_MINUTES * 60 * 1000

    for (const match of open) {
      const ms = getMsUntilPredictionLock(match.kickoff_at)
      if (ms <= 0 || ms > urgentMs) continue
      if (wasVibrated(match.id)) continue
      if (Date.now() - lastVibrateRef.current < 3000) continue

      markVibrated(match.id)
      lastVibrateRef.current = Date.now()
      vibrateLockUrgent()
      break
    }

    const id = window.setInterval(() => {
      for (const match of open) {
        const ms = getMsUntilPredictionLock(match.kickoff_at)
        if (ms <= 0 || ms > urgentMs) continue
        if (wasVibrated(match.id)) continue

        markVibrated(match.id)
        vibrateLockUrgent()
        return
      }
    }, 20_000)

    return () => window.clearInterval(id)
  }, [loading, urgentUnpickedCount, matches, predictions])

  return { urgentUnpickedCount }
}
