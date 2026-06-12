import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LiveScoreboard } from '../components/LiveScoreboard'
import { MatchCard } from '../components/MatchCard'
import { PenaltyShootout } from '../components/PenaltyShootout'
import { PredictionModal } from '../components/PredictionModal'
import { useNextMatchFocus } from '../hooks/useNextMatchFocus'
import { useMatches } from '../hooks/useMatches'
import { LockCountdown } from '../components/LockCountdown'
import {
  getPredictableMatches,
  PREDICTION_LOCK_BUFFER_MINUTES,
  formatPredictionLockTimeIst,
} from '../lib/matchUtils'
import { formatIstDateHeader, toIstDateKey } from '../lib/timezone'
import type { Match } from '../lib/types'

export function PredictPage() {
  const { matches, predictions, loading, refetch, liveScoreSyncing } = useMatches()
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [penaltyMatch, setPenaltyMatch] = useState<Match | null>(null)

  const openMatches = useMemo(() => getPredictableMatches(matches), [matches])

  const nextUnpicked = useMemo(
    () => openMatches.find((m) => !predictions[m.id]) ?? null,
    [openMatches, predictions],
  )

  const focusMatch = useMemo(
    () => nextUnpicked ?? openMatches[0] ?? null,
    [nextUnpicked, openMatches],
  )

  const pickedCount = useMemo(
    () => openMatches.filter((m) => predictions[m.id]).length,
    [openMatches, predictions],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>()
    for (const m of openMatches) {
      const key = toIstDateKey(m.kickoff_at)
      const list = map.get(key) ?? []
      list.push(m)
      map.set(key, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [openMatches])

  const { spotlightActive, dismissSpotlight } = useNextMatchFocus({
    surface: 'predict',
    pathname: '/predict',
    loading,
    focusMatch: nextUnpicked,
    scrollTargetId: 'predict-match',
  })

  return (
    <div>
      <LiveScoreboard matches={matches} syncing={liveScoreSyncing} />

      {focusMatch && !loading && (
        <LockCountdown
          kickoffAt={focusMatch.kickoff_at}
          variant="hero"
          saved={Boolean(predictions[focusMatch.id])}
          className="mb-4"
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 rounded-2xl border border-default bg-card p-4 shadow-card"
      >
        <p className="type-body-sm text-subtle text-pretty">
          {openMatches.length > 0 ? (
            <>
              <span className="font-semibold text-simelabs">Open picks</span>
              <span className="text-muted/50"> — </span>
              {pickedCount === openMatches.length
                ? 'All open matches predicted'
                : `${pickedCount} of ${openMatches.length} predicted`}
            </>
          ) : (
            'No open matches right now'
          )}
        </p>
        {openMatches.length > 0 && (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${openMatches.length ? (pickedCount / openMatches.length) * 100 : 0}%`,
              }}
              className="h-full rounded-full bg-gradient-to-r from-simelabs to-simelabs-light"
            />
          </div>
        )}
        {openMatches.length > 0 && (
          <div className="type-caption mt-2 space-y-1 leading-relaxed text-muted">
            <p>Today &amp; tomorrow stay open all day in IST — including midnight kickoffs.</p>
            <p>
              Picks lock {PREDICTION_LOCK_BUFFER_MINUTES} min before kickoff
              {focusMatch && (
                <>
                  {' '}
                  · next lock{' '}
                  <span className="whitespace-nowrap font-medium text-subtle">
                    {formatPredictionLockTimeIst(focusMatch.kickoff_at)} IST
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </motion.div>

      {loading && matches.length === 0 ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : openMatches.length === 0 ? (
        <div className="rounded-2xl border border-default bg-card p-8 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 font-medium">All caught up!</p>
          <p className="mt-1 text-sm text-muted">
            More matches open the day before they kick off (IST).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateKey, dayMatches]) => (
            <section key={dateKey}>
              <h3 className="type-caption mb-2 font-semibold uppercase tracking-wide text-muted">
                {formatIstDateHeader(dateKey)}
              </h3>
              <div className="space-y-3">
                {dayMatches.map((match) => {
                  const isNext = nextUnpicked?.id === match.id
                  const showSpotlight = spotlightActive && isNext

                  return (
                    <div
                      key={match.id}
                      id={`predict-match-${match.id}`}
                      className="scroll-mt-24"
                    >
                      {showSpotlight && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="type-overline mb-2 flex items-center gap-1.5 !text-[10px]"
                        >
                          <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-simelabs" />
                          Next up — pick this match
                        </motion.p>
                      )}
                      <MatchCard
                        match={match}
                        prediction={predictions[match.id]}
                        onPredict={(m) => {
                          dismissSpotlight()
                          setSelectedMatch(m)
                        }}
                        onPenaltyGame={predictions[match.id] ? setPenaltyMatch : undefined}
                        spotlight={showSpotlight}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <PredictionModal
        match={selectedMatch}
        allMatches={matches}
        initialHome={selectedMatch ? predictions[selectedMatch.id]?.home_pred ?? 0 : 0}
        initialAway={selectedMatch ? predictions[selectedMatch.id]?.away_pred ?? 0 : 0}
        onClose={() => setSelectedMatch(null)}
        onSaved={() => {
          dismissSpotlight()
          void refetch()
        }}
      />

      <PenaltyShootout
        match={penaltyMatch!}
        open={Boolean(penaltyMatch)}
        onClose={() => setPenaltyMatch(null)}
      />
    </div>
  )
}
