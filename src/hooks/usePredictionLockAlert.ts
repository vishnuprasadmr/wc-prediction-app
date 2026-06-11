import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import {
  getNextPredictableMatch,
  getMsUntilPredictionLock,
  LOCK_WARNING_MINUTES,
  formatPredictionLockTimeIst,
} from '../lib/matchUtils'
import { formatKickoffTimeIst } from '../lib/timezone'
import { maybeShowSystemNotification } from '../lib/engagementPrompts'

const STORAGE_PREFIX = 'wc-lock-warning:'

function wasWarningSent(matchId: string): boolean {
  try {
    return sessionStorage.getItem(`${STORAGE_PREFIX}${matchId}`) === '1'
  } catch {
    return false
  }
}

function markWarningSent(matchId: string): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${matchId}`, '1')
  } catch {
    /* ignore */
  }
}

/**
 * Fires a one-time push/in-app notification when a match enters the
 * final {LOCK_WARNING_MINUTES} before predictions lock (if still unpicked).
 */
export function usePredictionLockAlert() {
  const { user } = useAuth()
  const { matches, predictions, loading } = useMatches()
  const checkingRef = useRef(false)

  useEffect(() => {
    if (!user || loading) return undefined

    const check = () => {
      if (checkingRef.current) return
      checkingRef.current = true

      try {
        const next = getNextPredictableMatch(matches)
        if (!next || predictions[next.id]) return

        const ms = getMsUntilPredictionLock(next.kickoff_at)
        const warnMs = LOCK_WARNING_MINUTES * 60 * 1000
        if (ms <= 0 || ms > warnMs) return
        if (wasWarningSent(next.id)) return

        markWarningSent(next.id)
        const lockTime = formatPredictionLockTimeIst(next.kickoff_at)
        const kickoff = formatKickoffTimeIst(next.kickoff_at)

        void maybeShowSystemNotification(
          '15 minutes until lock!',
          `${next.home_team} vs ${next.away_team} — picks close at ${lockTime} IST (kickoff ${kickoff}).`,
          `lock-warning:${next.id}`,
          { whenVisible: true },
        )
      } finally {
        checkingRef.current = false
      }
    }

    check()
    const id = window.setInterval(check, 15_000)
    return () => window.clearInterval(id)
  }, [user, loading, matches, predictions])
}
