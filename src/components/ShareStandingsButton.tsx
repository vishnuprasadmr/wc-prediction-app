import { useState } from 'react'
import { buildStandingsShareText, shareStandings } from '../lib/shareStandings'
import type { PredictionWithMatch } from '../lib/types'

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
  const [status, setStatus] = useState<string | null>(null)

  const handleShare = async () => {
    const text = buildStandingsShareText({
      displayName,
      rank,
      totalPoints,
      exactScores,
      lastMatch: lastPrediction?.match
        ? {
            home: lastPrediction.match.home_team,
            away: lastPrediction.match.away_team,
            score: `${lastPrediction.match.home_score ?? 0}-${lastPrediction.match.away_score ?? 0}`,
            points: lastPrediction.points_earned,
          }
        : undefined,
    })

    const ok = await shareStandings(text)
    setStatus(ok ? 'Shared!' : 'Could not share')
    setTimeout(() => setStatus(null), 2000)
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="flex w-full items-center justify-between rounded-xl bg-card p-4 text-left transition hover:bg-muted"
    >
      <span>📤 Share your standings</span>
      <span className="text-sm text-simelabs">{status ?? '→'}</span>
    </button>
  )
}
