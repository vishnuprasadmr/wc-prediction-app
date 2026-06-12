import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { shareStandingsWithImage } from '../lib/shareStandings'
import { resolveUserAvatarUrl } from '../lib/avatarUrl'
import type { PredictionWithMatch } from '../lib/types'
import { playSound, primeAudio } from '../lib/sounds'

export function ShareStandingsButton({
  displayName,
  rank,
  totalPoints,
  exactScores,
  lastPrediction,
}: {
  displayName: string
  rank: number
  totalPoints: number
  exactScores: number
  lastPrediction?: PredictionWithMatch
}) {
  const { user, profile } = useAuth()
  const avatarUrl = profile?.avatar_url ?? resolveUserAvatarUrl(user)
  const [status, setStatus] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    setSharing(true)
    primeAudio()
    setStatus('Creating card…')

    const lastMatch = lastPrediction?.match
      ? {
          home: lastPrediction.match.home_team,
          away: lastPrediction.match.away_team,
          score: `${lastPrediction.match.home_score ?? 0}-${lastPrediction.match.away_score ?? 0}`,
          points: lastPrediction.points_earned,
          homePred: lastPrediction.home_pred,
          awayPred: lastPrediction.away_pred,
          firstBonus: lastPrediction.first_bonus ?? 0,
        }
      : undefined

    const ok = await shareStandingsWithImage({
      variant: lastMatch ? 'match-result' : 'standings',
      displayName,
      avatarUrl,
      rank,
      totalPoints,
      exactScores,
      lastMatch,
    })

    if (ok) playSound('save')
    setStatus(ok ? 'Shared!' : 'Could not share')
    setSharing(false)
    setTimeout(() => setStatus(null), 2500)
  }

  return (
    <button
      type="button"
      disabled={sharing}
      onClick={() => void handleShare()}
      className="flex w-full items-center justify-between rounded-xl border border-simelabs/25 bg-card p-4 text-left transition hover:bg-muted disabled:opacity-60"
    >
      <div>
        <span className="font-medium">📤 Share your standings</span>
        <p className="type-caption mt-0.5 text-muted">Branded image card with rank &amp; latest result</p>
      </div>
      <span className="shrink-0 text-sm text-simelabs">{status ?? '→'}</span>
    </button>
  )
}
