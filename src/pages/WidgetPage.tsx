import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useMatches } from '../hooks/useMatches'
import { MatchesProvider } from '../contexts/MatchesContext'
import {
  formatLockCountdownLive,
  formatPredictionLockTimeIst,
  getNextFocusMatch,
  getPredictableMatches,
} from '../lib/matchUtils'

function WidgetContent() {
  const { profile } = useAuth()
  const { matches, predictions, loading } = useMatches()
  const { entries } = useLeaderboard()
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const myEntry = useMemo(
    () => entries.find((e) => e.user_id === profile?.id),
    [entries, profile?.id],
  )

  const nextUnpicked = useMemo(() => {
    const open = getPredictableMatches(matches)
    return open.find((m) => !predictions[m.id]) ?? open[0] ?? null
  }, [matches, predictions])

  const focus = useMemo(
    () => getNextFocusMatch(matches, predictions),
    [matches, predictions],
  )

  const lockCountdown = nextUnpicked ? formatLockCountdownLive(nextUnpicked.kickoff_at) : null

  return (
    <div className="min-h-dvh bg-page p-4 text-theme">
      <div className="mx-auto max-w-sm space-y-3">
        <div className="rounded-2xl border border-simelabs/30 bg-card p-4 shadow-glow-sm">
          <p className="type-overline !text-[10px]">WC 26 widget</p>
          <h1 className="type-page-title mt-1">
            <span className="text-simelabs">Simelabs</span> League
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-default bg-card p-4 text-center">
            <p className="type-caption">Your rank</p>
            <p className="mt-1 font-heading text-3xl font-black text-simelabs">
              {loading ? '—' : (myEntry?.rank ?? '—')}
            </p>
          </div>
          <div className="rounded-2xl border border-default bg-card p-4 text-center">
            <p className="type-caption">Points</p>
            <p className="mt-1 font-heading text-3xl font-black">
              {loading ? '—' : (myEntry?.total_points ?? 0)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-card p-4">
          <p className="type-caption">Next lock</p>
          {nextUnpicked ? (
            <>
              <p className="mt-1 text-sm font-semibold leading-snug">
                {nextUnpicked.home_team} vs {nextUnpicked.away_team}
              </p>
              <p className="mt-2 font-heading text-2xl font-black tabular-nums text-simelabs">
                {lockCountdown ?? formatPredictionLockTimeIst(nextUnpicked.kickoff_at)}
              </p>
              <p className="type-caption mt-1">
                {predictions[nextUnpicked.id] ? 'Picked ✓' : 'Needs pick'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">No open picks right now</p>
          )}
        </div>

        {focus && (
          <Link
            to="/predict"
            className="block rounded-2xl bg-simelabs py-3 text-center text-sm font-semibold text-simelabs-foreground"
          >
            Open app to predict
          </Link>
        )}

        <Link to="/" className="block text-center text-xs text-muted hover:text-simelabs">
          Full app →
        </Link>
      </div>
    </div>
  )
}

/** Minimal glance view — pin to home screen or use PWA shortcut */
export function WidgetPage() {
  return (
    <MatchesProvider>
      <WidgetContent />
    </MatchesProvider>
  )
}
