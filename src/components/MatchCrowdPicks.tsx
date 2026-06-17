import { motion } from 'framer-motion'
import type { Match } from '../lib/types'
import { isMatchLocked } from '../lib/matchUtils'
import { useMatchCrowdSentiment } from '../hooks/useMatchCrowdSentiment'
import { useMatchPickReveal } from '../hooks/useMatchPickReveal'
import { useMatchPickStats } from '../hooks/useMatchPickStats'
import { buildCrowdSentimentLabel } from '../lib/pickCrowdSentiment'
import { LeaderboardAvatar } from './LeaderboardAvatar'

function SentimentBar({
  homePct,
  drawPct,
  awayPct,
  homeTeam,
  awayTeam,
}: {
  homePct: number
  drawPct: number
  awayPct: number
  homeTeam: string
  awayTeam: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="bg-simelabs"
          initial={{ width: 0 }}
          animate={{ width: `${homePct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          title={`${homeTeam} win ${homePct}%`}
        />
        <motion.div
          className="bg-muted-foreground/40"
          initial={{ width: 0 }}
          animate={{ width: `${drawPct}%` }}
          transition={{ duration: 0.7, delay: 0.08, ease: 'easeOut' }}
          title={`Draw ${drawPct}%`}
        />
        <motion.div
          className="bg-amber-400/80"
          initial={{ width: 0 }}
          animate={{ width: `${awayPct}%` }}
          transition={{ duration: 0.7, delay: 0.16, ease: 'easeOut' }}
          title={`${awayTeam} win ${awayPct}%`}
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium text-muted">
        <span>{homePct}% {homeTeam.slice(0, 3).toUpperCase()}</span>
        <span>{drawPct}% draw</span>
        <span>{awayPct}% {awayTeam.slice(0, 3).toUpperCase()}</span>
      </div>
    </div>
  )
}

export function MatchCrowdPicks({ match }: { match: Match }) {
  const locked = isMatchLocked(match)
  const finished = match.status === 'finished'
  const showCrowd = locked && !finished
  const showReveal = finished

  const { sentiment, loading: sentimentLoading } = useMatchCrowdSentiment(
    match.id,
    showCrowd || match.status === 'live',
  )
  const { rows: revealRows, loading: revealLoading } = useMatchPickReveal(match.id, showReveal)
  const { rows: statRows, loading: statsLoading } = useMatchPickStats(match.id, showReveal)

  if (!locked && !finished) return null

  const loading = showCrowd ? sentimentLoading : revealLoading || statsLoading

  if (loading) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-3 border-t border-default pt-3 text-center text-xs text-muted"
      >
        Reading the room…
      </motion.p>
    )
  }

  if (showCrowd && sentiment && sentiment.totalPicks > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="mt-3 border-t border-default pt-3"
      >
        <p className="type-caption mb-2 text-center font-semibold text-simelabs">
          {buildCrowdSentimentLabel(sentiment, match.home_team, match.away_team)}
        </p>
        <SentimentBar
          homePct={sentiment.homeWinPct}
          drawPct={sentiment.drawPct}
          awayPct={sentiment.awayWinPct}
          homeTeam={match.home_team}
          awayTeam={match.away_team}
        />
        <p className="mt-2 text-center text-[10px] text-muted">
          {sentiment.totalPicks} pick{sentiment.totalPicks === 1 ? '' : 's'} · names revealed at
          full-time
        </p>
      </motion.div>
    )
  }

  if (!showReveal || (revealRows.length === 0 && statRows.length === 0)) return null

  const total = statRows.reduce((s, r) => s + Number(r.pick_count), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="mt-3 border-t border-default pt-3"
    >
      <p className="type-caption mb-2 text-center font-medium">Who picked what</p>

      {statRows.length > 0 && (
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {statRows.map((r, i) => {
            const pct = total > 0 ? Math.round((Number(r.pick_count) / total) * 100) : 0
            return (
              <motion.span
                key={`${r.home_pred}-${r.away_pred}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-full bg-muted px-2.5 py-1 text-xs font-mono tabular-nums"
              >
                {r.home_pred}-{r.away_pred}{' '}
                <span className="text-muted">({pct}%)</span>
              </motion.span>
            )
          })}
        </div>
      )}

      {revealRows.length > 0 && (
        <ul className="max-h-48 space-y-1.5 overflow-y-auto">
          {revealRows.map((row, i) => (
            <motion.li
              key={`${row.display_name}-${row.home_pred}-${row.away_pred}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.03, type: 'spring', stiffness: 400, damping: 30 }}
              className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5"
            >
              <LeaderboardAvatar
                name={row.display_name}
                avatarUrl={row.avatar_url}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.display_name}</span>
              <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-simelabs">
                {row.home_pred}–{row.away_pred}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
