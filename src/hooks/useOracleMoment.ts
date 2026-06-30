import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import { isExactScorePoints } from '../lib/scoring'
import type { Match, Prediction } from '../lib/types'

const STORAGE_PREFIX = 'wc-oracle-moment:'

export interface OracleMomentData {
  match: Match
  prediction: Prediction
}

function wasShown(matchId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${matchId}`) === '1'
  } catch {
    return false
  }
}

function markShown(matchId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${matchId}`, '1')
  } catch {
    /* ignore */
  }
}

export function useOracleMoment() {
  const { user } = useAuth()
  const { matches, predictions, loading } = useMatches()
  const [moment, setMoment] = useState<OracleMomentData | null>(null)

  useEffect(() => {
    if (!user || loading || moment) return

    for (const match of matches) {
      if (match.status !== 'finished') continue
      const pred = predictions[match.id]
      if (!pred || pred.points_earned === null) continue
      if (!isExactScorePoints(pred.points_earned, pred.first_bonus ?? 0, pred.shootout_bonus ?? 0))
        continue
      if (wasShown(match.id)) continue

      markShown(match.id)
      setMoment({ match, prediction: pred })
      break
    }
  }, [user, loading, matches, predictions, moment])

  const dismiss = () => setMoment(null)

  return { moment, dismiss }
}
