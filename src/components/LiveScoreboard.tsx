import { motion, AnimatePresence } from 'framer-motion'
import type { Match } from '../lib/types'
import { formatStageLabel, getLiveMatches } from '../lib/matchUtils'
import { TeamLabel } from './TeamLabel'

interface LiveScoreboardProps {
  matches: Match[]
  syncing?: boolean
}

function LiveMatchRow({ match }: { match: Match }) {
  const hasScore =
    match.home_score !== null &&
    match.home_score !== undefined &&
    match.away_score !== null &&
    match.away_score !== undefined

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-3"
    >
      <div className="flex items-start justify-between gap-2">
        <TeamLabel team={match.home_team} emoji={match.home_flag} flagSize="sm" />

        <div className="flex shrink-0 flex-col items-center self-center px-1">
          <span className="type-overline mb-0.5 flex items-center gap-1 !text-[10px] !tracking-wide text-red-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            LIVE
          </span>
          <motion.span
            key={`${match.home_score}-${match.away_score}`}
            initial={{ scale: 1.15, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-mono text-2xl font-bold tabular-nums text-theme"
          >
            {hasScore ? `${match.home_score} – ${match.away_score}` : '– –'}
          </motion.span>
        </div>

        <TeamLabel team={match.away_team} emoji={match.away_flag} flagSize="sm" />
      </div>
      <p className="type-caption mt-1.5 text-center text-muted">
        {formatStageLabel(match.stage, match.group_name)}
      </p>
    </motion.div>
  )
}

export function LiveScoreboard({ matches, syncing = false }: LiveScoreboardProps) {
  const live = getLiveMatches(matches)

  if (live.length === 0) return null

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 via-card to-card shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-red-500/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <h2 className="text-sm font-bold text-theme">Live now</h2>
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
            {live.length}
          </span>
        </div>
        <span className="type-caption text-muted">
          {syncing ? (
            <span className="animate-pulse">Syncing to league…</span>
          ) : (
            <span>Live from FIFA · refreshes every 30s</span>
          )}
        </span>
      </div>
      <div className="space-y-2 p-3">
        <AnimatePresence mode="popLayout">
          {live.map((match) => (
            <LiveMatchRow key={match.id} match={match} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}
