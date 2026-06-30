import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import { showGameNotification } from '../lib/notificationTheme'
import { isExactScorePoints } from '../lib/scoring'

const STORAGE_PREFIX = 'wc-ft-notify:'

function wasNotified(matchId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${matchId}`) === '1'
  } catch {
    return false
  }
}

function markNotified(matchId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${matchId}`, '1')
  } catch {
    /* ignore */
  }
}

/** Notify when a match you predicted finishes (points + optional exact-score fanfare). */
export function useMatchResultNotifications() {
  const { user } = useAuth()
  const { matches, predictions, loading } = useMatches()
  const checkingRef = useRef(false)

  useEffect(() => {
    if (!user || loading) return undefined
    if (typeof window === 'undefined' || !('Notification' in window)) return undefined
    if (Notification.permission !== 'granted') return undefined

    const check = () => {
      if (checkingRef.current) return
      checkingRef.current = true

      try {
        for (const match of matches) {
          if (match.status !== 'finished') continue
          const pred = predictions[match.id]
          if (!pred || pred.points_earned === null) continue
          if (wasNotified(match.id)) continue

          markNotified(match.id)
          const score = `${match.home_score ?? 0}-${match.away_score ?? 0}`
          const exact = isExactScorePoints(
            pred.points_earned,
            pred.first_bonus ?? 0,
            pred.shootout_bonus ?? 0,
          )
          const title = exact ? 'Exact score!' : 'Full time!'
          const body = `${match.home_team} ${score} ${match.away_team} — +${pred.points_earned} pts (you picked ${pred.home_pred}-${pred.away_pred})`

          void showGameNotification({
            title,
            body,
            tag: `ft:${match.id}`,
            kind: exact ? 'result' : 'leaderboard',
            url: '/leaderboard',
            whenVisible: true,
          })
        }
      } finally {
        checkingRef.current = false
      }
    }

    check()
    const id = window.setInterval(check, 30_000)
    return () => window.clearInterval(id)
  }, [user, loading, matches, predictions])
}
