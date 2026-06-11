import { motion } from 'framer-motion'
import type { LeaderboardEntry } from '../lib/types'
import { useAuth } from '../contexts/AuthContext'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  loading?: boolean
  rankingsAvailable?: boolean
}

const rankColors = ['text-yellow-500', 'text-subtle', 'text-amber-600']

export function LeaderboardTable({
  entries,
  loading,
  rankingsAvailable = true,
}: LeaderboardTableProps) {
  const { user } = useAuth()

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    )
  }

  if (!rankingsAvailable) {
    return (
      <div className="rounded-2xl border border-default bg-card p-8 text-center">
        <p className="text-4xl">🏆</p>
        <p className="mt-2 font-medium text-subtle">Table not open yet</p>
        <p className="mt-1 text-sm text-muted">
          Rankings appear after the first match finishes. Make your predictions now!
        </p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-default bg-card p-8 text-center">
        <p className="text-4xl">🏆</p>
        <p className="mt-2 font-medium text-subtle">No scores yet</p>
        <p className="mt-1 text-sm text-muted">Predictions are in — check back once matches kick off.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const isMe = entry.user_id === user?.id
        const rankColor = rankColors[entry.rank - 1] ?? 'text-muted'

        return (
          <motion.div
            key={entry.user_id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
              isMe
                ? 'border-simelabs/40 bg-simelabs/10 shadow-glow-sm'
                : 'border-default bg-card'
            }`}
          >
            <div className={`w-8 text-center text-lg font-bold ${rankColor}`}>
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-simelabs/30 to-simelabs-dark/30 text-sm font-bold">
              {entry.display_name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold">
                {entry.display_name}
                {isMe && <span className="ml-1 text-xs text-simelabs">(you)</span>}
              </p>
              <p className="text-xs text-muted">
                {entry.exact_scores} exact · {entry.predictions_made} predicted
              </p>
            </div>

            <motion.div
              key={entry.total_points}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-right"
            >
              <p className="text-xl font-bold tabular-nums text-simelabs">
                {entry.total_points}
              </p>
              <p className="text-xs text-muted">pts</p>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}
