import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import {
  getPredictableMatches,
  getMsUntilPredictionLock,
  LOCK_WARNING_MINUTES,
  formatPredictionLockTimeIst,
} from '../lib/matchUtils'
import { formatKickoffTimeIst } from '../lib/timezone'
import { showGameNotification } from '../lib/notificationTheme'

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
        const warnMs = LOCK_WARNING_MINUTES * 60 * 1000
        const open = getPredictableMatches(matches).filter((m) => !predictions[m.id])

        for (const match of open) {
          const ms = getMsUntilPredictionLock(match.kickoff_at)
          if (ms <= 0 || ms > warnMs) continue
          if (wasWarningSent(match.id)) continue

          markWarningSent(match.id)
          const lockTime = formatPredictionLockTimeIst(match.kickoff_at)
          const kickoff = formatKickoffTimeIst(match.kickoff_at)

          void showGameNotification({
            title: `${LOCK_WARNING_MINUTES} minutes until lock!`,
            body: `${match.home_team} vs ${match.away_team} — picks close at ${lockTime} IST (kickoff ${kickoff}).`,
            tag: `lock-warning:${match.id}`,
            kind: 'lock',
            url: '/predict',
            whenVisible: true,
          })
        }
      } finally {
        checkingRef.current = false
      }
    }

    check()
    const id = window.setInterval(check, 15_000)
    return () => window.clearInterval(id)
  }, [user, loading, matches, predictions])
}
