import { motion } from 'framer-motion'
import type { RankReveal } from '../hooks/useLeaderboardReveal'
import type { LeaderboardEntry } from '../lib/types'
import type { HeartTeamMap } from '../hooks/useLeaderboard'
import { sortPlayersAlphabetically } from '../lib/leaderboardUtils'
import { useAuth } from '../contexts/AuthContext'
import { LeaderboardAvatar } from './LeaderboardAvatar'
import { LeaderboardPodium } from './LeaderboardPodium'
import { SupportingTeamFlag } from './SupportingTeamFlag'
import { TruncatedText } from './TruncatedText'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  heartTeams?: HeartTeamMap
  loading?: boolean
  rankingsAvailable?: boolean
  rankReveal?: RankReveal | null
}

function rankRowMotion(isMe: boolean, reveal: RankReveal | null | undefined) {
  if (!isMe || !reveal || reveal === 'same') {
    return {
      initial: { opacity: 0, x: -12 },
      animate: { opacity: 1, x: 0, y: 0 },
    }
  }

  const y = reveal === 'up' || reveal === 'debut' ? 28 : reveal === 'down' ? -28 : 0
  return {
    initial: { opacity: 0, y, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
  }
}

function LeaderboardRow({
  entry,
  index,
  isMe,
  rankReveal,
  heartTeam,
}: {
  entry: LeaderboardEntry
  index: number
  isMe: boolean
  rankReveal?: RankReveal | null
  heartTeam?: string | null
}) {
  const motionProps = rankRowMotion(isMe, rankReveal)

  return (
    <motion.div
      layout
      {...motionProps}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 28,
        delay: isMe ? 0.05 : index * 0.03,
      }}
      className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
        isMe
          ? 'border-simelabs/40 bg-gradient-to-r from-simelabs/12 to-card shadow-glow-sm'
          : 'border-default bg-card shadow-card'
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-default bg-muted font-heading text-sm font-bold tabular-nums text-subtle">
        {entry.rank}
      </div>

      <LeaderboardAvatar
        name={entry.display_name}
        avatarUrl={entry.avatar_url}
        heartTeam={heartTeam}
        size="sm"
      />

      <div className="flex-1 min-w-0">
        <p className="flex min-w-0 items-center gap-1.5 font-semibold">
          <TruncatedText text={entry.display_name} className="min-w-0 flex-1" />
          {heartTeam && (
            <SupportingTeamFlag team={heartTeam} variant="inline" className="hidden sm:inline-flex" />
          )}
          {isMe && (
            <span className="shrink-0 text-xs font-medium text-simelabs">
              {rankReveal === 'up' && '↑'}
              {rankReveal === 'down' && '↓'}
              {' '}
              (you)
            </span>
          )}
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
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        className="text-right"
      >
        <p className="type-stat text-simelabs">{entry.total_points}</p>
        <p className="type-caption">pts</p>
      </motion.div>
    </motion.div>
  )
}

export function LeaderboardTable({
  entries,
  heartTeams = {},
  loading,
  rankingsAvailable = true,
  rankReveal = null,
}: LeaderboardTableProps) {
  const { user } = useAuth()

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-48 animate-pulse rounded-2xl bg-card" />
        {[...Array(4)].map((_, i) => (
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
                <LeaderboardAvatar
                  name={entry.display_name}
                  avatarUrl={entry.avatar_url}
                  heartTeam={heartTeams[entry.user_id]}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="flex min-w-0 items-center gap-1.5 font-semibold">
                    <TruncatedText text={entry.display_name} className="min-w-0 flex-1" />
                    {heartTeams[entry.user_id] && (
                      <SupportingTeamFlag
                        team={heartTeams[entry.user_id]}
                        variant="inline"
                        className="hidden sm:inline-flex"
                      />
                    )}
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

  const rest = entries.filter((e) => e.rank > 3)

  return (
    <div>
      {entries.length >= 1 && (
        <LeaderboardPodium
          entries={entries}
          heartTeams={heartTeams}
          currentUserId={user?.id}
          rankReveal={rankReveal}
        />
      )}

      {rankReveal && rankReveal !== 'same' && user && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 rounded-xl border px-3 py-2 text-center ${
            rankReveal === 'down'
              ? 'border-default bg-muted'
              : 'border-simelabs/30 bg-simelabs/8'
          }`}
        >
          <p
            className={`type-body-sm font-medium ${
              rankReveal === 'down' ? 'text-subtle' : 'text-simelabs'
            }`}
          >
            {rankReveal === 'up' && '↑ You moved up the table'}
            {rankReveal === 'down' && '↓ A few places down — next match is yours'}
            {rankReveal === 'debut' && 'Welcome to the point table'}
          </p>
        </motion.div>
      )}

      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.length > 0 && entries.length > 3 && (
            <p className="type-overline mb-2 !text-[10px] text-muted">
              Rest of the table
            </p>
          )}
          {rest.map((entry, index) => (
            <LeaderboardRow
              key={entry.user_id}
              entry={entry}
              index={index}
              isMe={entry.user_id === user?.id}
              rankReveal={rankReveal}
              heartTeam={heartTeams[entry.user_id]}
            />
          ))}
        </div>
      )}

    </div>
  )
}
