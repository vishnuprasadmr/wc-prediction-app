import { useMatchPickStats } from '../hooks/useMatchPickStats'

export function MatchPickDistribution({
  matchId,
  finished,
}: {
  matchId: string
  finished: boolean
}) {
  const { rows, loading } = useMatchPickStats(matchId, finished)

  if (!finished) return null
  if (loading) {
    return <p className="mt-2 text-center text-xs text-muted animate-pulse">Loading picks…</p>
  }
  if (rows.length === 0) return null

  const total = rows.reduce((s, r) => s + Number(r.pick_count), 0)

  return (
    <div className="mt-3 border-t border-default pt-3">
      <p className="type-caption mb-2 text-center font-medium">Who picked what</p>
      <div className="flex flex-wrap justify-center gap-2">
        {rows.map((r) => {
          const pct = total > 0 ? Math.round((Number(r.pick_count) / total) * 100) : 0
          return (
            <span
              key={`${r.home_pred}-${r.away_pred}`}
              className="rounded-full bg-muted px-2.5 py-1 text-xs font-mono tabular-nums"
              title={`${r.pick_count} pick${r.pick_count === 1 ? '' : 's'}`}
            >
              {r.home_pred}-{r.away_pred}{' '}
              <span className="text-muted">({pct}%)</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
