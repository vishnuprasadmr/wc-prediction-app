import type { PredictionWithMatch } from './types'
import { isExactScorePoints } from './scoring'

export interface Badge {
  id: string
  label: string
  icon: string
  earned: boolean
}

export function computeBadges(predictions: PredictionWithMatch[]): Badge[] {
  const finished = predictions.filter((p) => p.match?.status === 'finished')
  const withPoints = finished.filter((p) => (p.points_earned ?? 0) > 0)
  const exacts = finished.filter((p) =>
    p.points_earned !== null &&
    isExactScorePoints(p.points_earned, p.first_bonus ?? 0, p.shootout_bonus ?? 0),
  )
  const earlyBirds = finished.filter((p) => (p.first_bonus ?? 0) > 0)

  let streak = 0
  const byKickoff = [...finished].sort(
    (a, b) =>
      new Date(b.match.kickoff_at).getTime() - new Date(a.match.kickoff_at).getTime(),
  )
  for (const p of byKickoff) {
    if ((p.points_earned ?? 0) > 0) streak += 1
    else break
  }

  return [
    { id: 'first_pick', label: 'First pick', icon: '⚽', earned: predictions.length > 0 },
    { id: 'on_board', label: 'On the board', icon: '📊', earned: withPoints.length > 0 },
    { id: 'exact', label: 'Exact score', icon: '🎯', earned: exacts.length > 0 },
    { id: 'early', label: 'Early bird', icon: '⚡', earned: earlyBirds.length > 0 },
    { id: 'streak3', label: '3-match streak', icon: '🔥', earned: streak >= 3 },
    { id: 'five_exact', label: '5 exact scores', icon: '🏆', earned: exacts.length >= 5 },
  ]
}
