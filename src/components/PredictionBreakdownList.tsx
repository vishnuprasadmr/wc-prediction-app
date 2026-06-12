import type { PredictionWithMatch } from '../lib/types'
import { explainPoints } from '../lib/pointsBreakdown'

export function PredictionBreakdownList({ predictions }: { predictions: PredictionWithMatch[] }) {
  const finished = predictions
    .filter((p) => p.match?.status === 'finished' && p.points_earned !== null)
    .slice(0, 8)

  if (finished.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="type-section-title">Points breakdown</h3>
      {finished.map((p) => {
        const actualHome = p.match.home_score ?? 0
        const actualAway = p.match.away_score ?? 0
        const { lines, total } = explainPoints(
          p.home_pred,
          p.away_pred,
          actualHome,
          actualAway,
          p.first_bonus ?? 0,
        )

        return (
          <div key={p.id} className="rounded-xl bg-card p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-balance font-medium leading-snug">
                {p.match.home_team} vs {p.match.away_team}
              </p>
              <span className="shrink-0 font-mono text-xs text-muted">
                FT {actualHome}-{actualAway}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Your pick {p.home_pred}-{p.away_pred}
            </p>
            <ul className="mt-2 space-y-0.5 text-xs text-subtle">
              {lines.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
            <p className="mt-2 text-right text-sm font-bold text-simelabs">+{total} pts</p>
          </div>
        )
      })}
    </div>
  )
}
