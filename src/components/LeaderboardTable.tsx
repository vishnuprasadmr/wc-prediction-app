import { motion } from 'framer-motion'
import type { LeaderboardEntry } from '../lib/types'
import { sortPlayersAlphabetically } from '../lib/leaderboardUtils'
import { useAuth } from '../contexts/AuthContext'
import { ProfileAvatar } from './ProfileAvatar'
import { TruncatedText } from './TruncatedText'

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
    const players = sortPlayersAlphabetically(entries)

    if (players.length === 0) {
      return (
        <div className="rounded-2xl border border-default bg-card p-8 text-center">
          <p className="text-4xl">👥</p>
          <p className="mt-2 font-medium text-subtle">No players yet</p>
          <p className="mt-1 text-sm text-muted">Share the invite code so teammates can join.</p>
        </div>
      )
    }

    return (
      <div>
        <p className="type-body-sm mb-3 text-balance text-muted">
          <span className="font-medium text-subtle">
            {players.length} player{players.length === 1 ? '' : 's'} in the league
          </span>
          <span className="mt-0.5 block sm:mt-0 sm:inline">
            <span className="hidden sm:inline text-muted/50"> · </span>
            Rankings open after the first match
          </span>
        </p>
        <div className="space-y-2">
          {players.map((entry, index) => {
            const isMe = entry.user_id === user?.id
            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
                  isMe
                    ? 'border-simelabs/40 bg-simelabs/10 shadow-glow-sm'
                    : 'border-default bg-card'
                }`}
              >
                <ProfileAvatar
                  name={entry.display_name}
                  avatarUrl={entry.avatar_url}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="flex min-w-0 items-baseline gap-1 font-semibold">
                    <TruncatedText text={entry.display_name} className="min-w-0 flex-1" />
                    {isMe && <span className="shrink-0 text-xs text-simelabs">(you)</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {entry.predictions_made > 0
                      ? `${entry.predictions_made} prediction${entry.predictions_made === 1 ? '' : 's'} made`
                      : 'Joined · no predictions yet'}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
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

            <ProfileAvatar
              name={entry.display_name}
              avatarUrl={entry.avatar_url}
              size="sm"
            />

            <div className="flex-1 min-w-0">
              <p className="flex min-w-0 items-baseline gap-1 font-semibold">
                <TruncatedText text={entry.display_name} className="min-w-0 flex-1" />
                {isMe && <span className="shrink-0 text-xs text-simelabs">(you)</span>}
              </p>
              <p className="text-xs text-muted text-pretty">
                {entry.exact_scores} exact
                {(entry.early_bonuses ?? 0) > 0 && ` · ${entry.early_bonuses} early`}
                {(entry.season_bonuses ?? 0) > 0 && ` · ${entry.season_bonuses} season`}
                {' · '}
                {entry.predictions_made} predicted
              </p>
            </div>

            <motion.div
              key={entry.total_points}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-right"
            >
              <p className="type-stat text-simelabs">{entry.total_points}</p>
              <p className="type-caption">pts</p>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}
