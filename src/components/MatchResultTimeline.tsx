import { useMatchPickStats } from '../hooks/useMatchPickStats'
import { buildMatchTimeline } from '../lib/matchTimeline'
import type { Match, Prediction } from '../lib/types'

export function MatchResultTimeline({
  match,
  prediction,
}: {
  match: Match
  prediction: Prediction
}) {
  const { rows } = useMatchPickStats(match.id, match.status === 'finished')
  const steps = buildMatchTimeline(match, prediction, rows)

  if (match.status !== 'finished' || steps.length === 0) return null

  return (
    <div className="mt-3 border-t border-default pt-3">
      <p className="type-caption mb-2 text-center font-medium">Match recap</p>
      <ol className="relative ml-3 space-y-3 border-l border-simelabs/25 pl-4">
        {steps.map((step, i) => (
          <li key={`${step.label}-${i}`} className="relative">
            <span
              className={`absolute -left-[1.35rem] top-1 h-2 w-2 rounded-full ${
                step.highlight ? 'bg-simelabs shadow-glow-sm' : 'bg-muted'
              }`}
            />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              {step.label}
            </p>
            <p className={`text-xs ${step.highlight ? 'font-semibold text-simelabs' : 'text-subtle'}`}>
              {step.detail}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
