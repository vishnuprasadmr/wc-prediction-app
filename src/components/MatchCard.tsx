import { motion } from 'framer-motion'
import type { Match, Prediction } from '../lib/types'
import {
  formatCountdown,
  formatPredictionLockTimeIst,
  formatStageLabel,
  getMatchFilterStatus,
  isMatchLocked,
  PREDICTION_LOCK_BUFFER_MINUTES,
  statusLabel,
} from '../lib/matchUtils'
import { formatKickoffTimeIst } from '../lib/timezone'
import { formatVenueLabel, getMatchVenueCity } from '../lib/venues'
import { TeamFlag } from './TeamFlag'

interface MatchCardProps {
  match: Match
  prediction?: Prediction
  index?: number
  onPredict?: (match: Match) => void
  showPoints?: boolean
}

export function MatchCard({ match, prediction, index = 0, onPredict, showPoints }: MatchCardProps) {
  const locked = isMatchLocked(match)
  const filterStatus = getMatchFilterStatus(match)
  const countdown = filterStatus === 'upcoming' ? formatCountdown(match.kickoff_at) : null
  const venueCity = getMatchVenueCity(match)
  const hasScore =
    match.status !== 'scheduled' &&
    match.home_score !== null &&
    match.home_score !== undefined &&
    match.away_score !== null &&
    match.away_score !== undefined
  const showPredictionScore =
    match.status === 'scheduled' && prediction !== undefined && prediction !== null

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 320, damping: 28 }}
      whileHover={{ y: -2 }}
      className={`overflow-hidden rounded-2xl border border-default bg-card shadow-card transition-shadow hover:shadow-md ${
        match.status === 'live' ? 'ring-2 ring-red-500/60' : ''
      }`}
    >
      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <TeamSide name={match.home_team} emoji={match.home_flag} side="home" />
          <CenterBlock
            match={match}
            hasScore={hasScore}
            showPredictionScore={showPredictionScore}
            prediction={prediction}
            countdown={countdown}
          />
          <TeamSide name={match.away_team} emoji={match.away_flag} side="away" />
        </div>

        <p className="mt-3 text-center text-xs text-muted">
          {formatStageLabel(match.stage, match.group_name)}
          {venueCity && (
            <>
              <span className="mx-1.5">·</span>
              {formatVenueLabel(venueCity)}
            </>
          )}
        </p>

        {prediction && match.status === 'finished' && showPoints && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted">
            <span>
              Your pick: {prediction.home_pred} - {prediction.away_pred}
            </span>
            {prediction.points_earned !== null && (
              <span
                className={`rounded-full px-2 py-0.5 font-semibold ${
                  prediction.points_earned === 5
                    ? 'bg-amber-500/20 text-amber-500'
                    : prediction.points_earned > 0
                      ? 'bg-emerald-500/20 text-emerald-600'
                      : 'bg-muted text-muted'
                }`}
              >
                +{prediction.points_earned} pts
              </span>
            )}
          </div>
        )}
      </div>

      {onPredict && !locked && (
        <button
          type="button"
          onClick={() => onPredict(match)}
          className="w-full border-t border-default py-2.5 text-sm font-semibold text-simelabs transition hover:bg-muted"
        >
          {prediction ? 'Edit prediction' : 'Predict score'}
        </button>
      )}

      {locked && match.status === 'scheduled' && (
        <div className="border-t border-default py-2 text-center text-xs text-red-500">
          {prediction
            ? `Locked · your pick ${prediction.home_pred}-${prediction.away_pred}`
            : `Locked · picks close ${PREDICTION_LOCK_BUFFER_MINUTES} min before kickoff (${formatPredictionLockTimeIst(match.kickoff_at)} IST)`}
        </div>
      )}
    </motion.article>
  )
}

function TeamSide({
  name,
  emoji,
  side,
}: {
  name: string
  emoji: string
  side: 'home' | 'away'
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2.5 ${
        side === 'home' ? 'justify-end text-right' : 'justify-start text-left'
      }`}
    >
      {side === 'home' && (
        <>
          <span className="truncate text-sm font-semibold leading-tight text-theme sm:text-base">{name}</span>
          <TeamFlag team={name} emoji={emoji} />
        </>
      )}
      {side === 'away' && (
        <>
          <TeamFlag team={name} emoji={emoji} />
          <span className="truncate text-sm font-semibold leading-tight text-theme sm:text-base">{name}</span>
        </>
      )}
    </div>
  )
}

function CenterBlock({
  match,
  hasScore,
  showPredictionScore,
  prediction,
  countdown,
}: {
  match: Match
  hasScore: boolean
  showPredictionScore: boolean
  prediction?: Prediction
  countdown: string | null
}) {
  if (match.status === 'live') {
    return (
      <div className="flex shrink-0 flex-col items-center px-1">
        <span className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          Live
        </span>
        <span className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {match.home_score} - {match.away_score}
        </span>
      </div>
    )
  }

  if (hasScore || match.status === 'finished') {
    return (
      <div className="flex shrink-0 flex-col items-center px-1">
        <span className="mb-0.5 text-[10px] font-semibold uppercase text-muted">
          {statusLabel(match.status) || 'FT'}
        </span>
        <span className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {match.home_score} - {match.away_score}
        </span>
      </div>
    )
  }

  if (showPredictionScore && prediction) {
    return (
      <div className="flex shrink-0 flex-col items-center px-1">
        <span className="mb-0.5 text-[10px] font-medium text-simelabs">Your pick</span>
        <span className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {prediction.home_pred} - {prediction.away_pred}
        </span>
      </div>
    )
  }

  return (
    <div className="flex shrink-0 flex-col items-center px-2">
      <time
        dateTime={match.kickoff_at}
        className="text-3xl font-bold tabular-nums tracking-tight sm:text-4xl"
      >
        {formatKickoffTimeIst(match.kickoff_at)}
      </time>
      {countdown && (
        <span className="mt-0.5 text-[10px] font-medium text-muted">in {countdown}</span>
      )}
    </div>
  )
}
