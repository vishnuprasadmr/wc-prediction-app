import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MatchCard } from '../components/MatchCard'
import { PredictionModal } from '../components/PredictionModal'
import { useMatches } from '../hooks/useMatches'
import { LockCountdown } from '../components/LockCountdown'
import {
  getNextPredictableMatch,
  PREDICTION_LOCK_BUFFER_MINUTES,
  formatPredictionLockTimeIst,
} from '../lib/matchUtils'
import type { Match } from '../lib/types'

export function PredictPage() {
  const { matches, predictions, loading, refetch } = useMatches()
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const nextMatch = useMemo(() => getNextPredictableMatch(matches), [matches])

  const hasPrediction = nextMatch ? Boolean(predictions[nextMatch.id]) : false

  const queuedCount = useMemo(() => {
    if (!nextMatch) return 0
    const nextKickoff = new Date(nextMatch.kickoff_at).getTime()
    return matches.filter(
      (m) =>
        m.status === 'scheduled' &&
        new Date(m.kickoff_at).getTime() > nextKickoff,
    ).length
  }, [matches, nextMatch])

  return (
    <div>
      {nextMatch && !loading && (
        <LockCountdown
          kickoffAt={nextMatch.kickoff_at}
          variant="hero"
          saved={hasPrediction}
          className="mb-4"
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 rounded-2xl border border-default bg-card p-4 shadow-card"
      >
        <p className="type-body-sm text-subtle text-pretty">
          {nextMatch ? (
            <>
              <span className="font-semibold text-simelabs">Next match</span>
              <span className="text-muted/50"> — </span>
              {hasPrediction ? 'Prediction saved' : 'Make your pick before the lock'}
            </>
          ) : (
            'No open matches right now'
          )}
        </p>
        {nextMatch && (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: hasPrediction ? '100%' : '0%' }}
              className="h-full rounded-full bg-gradient-to-r from-simelabs to-simelabs-light"
            />
          </div>
        )}
        {nextMatch && (
          <p className="type-caption mt-2 text-pretty">
            Picks lock at{' '}
            <span className="whitespace-nowrap font-medium text-subtle">
              {formatPredictionLockTimeIst(nextMatch.kickoff_at)} IST
            </span>
            <span className="block sm:inline">
              <span className="hidden sm:inline"> </span>
              ({PREDICTION_LOCK_BUFFER_MINUTES} min before kickoff)
            </span>
            {queuedCount > 0 && (
              <span className="mt-0.5 block sm:mt-0 sm:inline">
                <span className="hidden sm:inline text-muted/50"> · </span>
                {queuedCount} more match{queuedCount === 1 ? '' : 'es'} after this
              </span>
            )}
          </p>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : !nextMatch ? (
        <div className="rounded-2xl border border-default bg-card p-8 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 font-medium">All caught up!</p>
          <p className="mt-1 text-sm text-muted">No open matches to predict right now.</p>
        </div>
      ) : (
        <MatchCard
          match={nextMatch}
          prediction={predictions[nextMatch.id]}
          onPredict={setSelectedMatch}
        />
      )}

      <PredictionModal
        match={selectedMatch}
        allMatches={matches}
        initialHome={selectedMatch ? predictions[selectedMatch.id]?.home_pred ?? 0 : 0}
        initialAway={selectedMatch ? predictions[selectedMatch.id]?.away_pred ?? 0 : 0}
        onClose={() => setSelectedMatch(null)}
        onSaved={refetch}
      />
    </div>
  )
}
