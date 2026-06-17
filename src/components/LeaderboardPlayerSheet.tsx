import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { LeaderboardEntry } from '../lib/types'
import { computePlayerGaps } from '../lib/leaderboardUtils'
import { formatLastPickUpdated } from '../lib/timezone'
import { LeaderboardAvatar } from './LeaderboardAvatar'
import { SupportingTeamFlag } from './SupportingTeamFlag'

interface LeaderboardPlayerSheetProps {
  entry: LeaderboardEntry | null
  allEntries: LeaderboardEntry[]
  heartTeam?: string | null
  currentUserId?: string
  onClose: () => void
  onSetRival?: (userId: string) => void
}

function StatBar({
  label,
  value,
  max,
  color = 'bg-simelabs',
}: {
  label: string
  value: number
  max: number
  color?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold tabular-nums text-theme">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

export function LeaderboardPlayerSheet({
  entry,
  allEntries,
  heartTeam,
  currentUserId,
  onClose,
  onSetRival,
}: LeaderboardPlayerSheetProps) {
  const me = allEntries.find((e) => e.user_id === currentUserId)
  const isMe = entry?.user_id === currentUserId
  const gaps = entry ? computePlayerGaps(entry, allEntries) : null

  const maxExact = Math.max(...allEntries.map((e) => e.exact_scores), 1)
  const maxPredictions = Math.max(...allEntries.map((e) => e.predictions_made), 1)
  const maxPoints = Math.max(...allEntries.map((e) => e.total_points), 1)

  return createPortal(
    <AnimatePresence>
      {entry && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[100] mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-t-3xl border border-default bg-card shadow-2xl"
          >
            <div className="p-6 pb-8">
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" />

              <div className="flex items-start gap-4">
                <LeaderboardAvatar
                  name={entry.display_name}
                  avatarUrl={entry.avatar_url}
                  heartTeam={heartTeam}
                  size="lg"
                  ringClassName="ring-2 ring-simelabs/35"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-simelabs/15 font-heading text-sm font-bold text-simelabs">
                      #{entry.rank}
                    </span>
                    {isMe && (
                      <span className="rounded-full bg-simelabs/15 px-2 py-0.5 text-[10px] font-bold uppercase text-simelabs">
                        You
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-theme">{entry.display_name}</h2>
                  {heartTeam && (
                    <div className="mt-1">
                      <SupportingTeamFlag team={heartTeam} variant="inline" />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    {entry.last_prediction_at ? (
                      <>
                        <span className="font-medium text-theme">Last pick updated</span>
                        <span className="mt-0.5 block tabular-nums">
                          {formatLastPickUpdated(entry.last_prediction_at)}
                        </span>
                      </>
                    ) : entry.predictions_made > 0 ? (
                      'Picks on file — update time unavailable'
                    ) : (
                      'No match picks yet'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-default text-muted hover:text-theme"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-simelabs/25 bg-gradient-to-br from-simelabs/12 to-card p-4 text-center">
                <p className="type-overline !text-[10px]">Total points</p>
                <p className="font-heading text-4xl font-black tabular-nums text-simelabs">
                  {entry.total_points}
                </p>
                {gaps && gaps.behindLeader > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    {gaps.behindLeader} pts behind the leader
                  </p>
                )}
                {gaps && entry.rank === 1 && (
                  <p className="mt-1 text-xs font-medium text-simelabs">League leader</p>
                )}
              </div>

              <div className="mt-5 space-y-4">
                <StatBar label="Exact scores" value={entry.exact_scores} max={maxExact} />
                <StatBar
                  label="Predictions made"
                  value={entry.predictions_made}
                  max={maxPredictions}
                  color="bg-emerald-500"
                />
                <StatBar
                  label="Total points"
                  value={entry.total_points}
                  max={maxPoints}
                  color="bg-simelabs"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniStat label="Early" value={entry.early_bonuses ?? 0} />
                <MiniStat label="Season" value={entry.season_bonuses ?? 0} />
                <MiniStat label="Bonus" value={entry.engagement_bonuses ?? 0} />
                <MiniStat label="Exact" value={entry.exact_scores} />
              </div>

              {gaps && (gaps.playerAbove || gaps.playerBelow) && (
                <div className="mt-5 space-y-2 rounded-xl border border-default bg-muted/40 p-3">
                  <p className="type-overline !text-[10px]">Around them</p>
                  {gaps.playerAbove && (
                    <NeighborRow
                      label="Above"
                      name={gaps.playerAbove.display_name}
                      rank={gaps.playerAbove.rank}
                      diff={gaps.behindAbove ?? 0}
                      diffLabel="behind"
                    />
                  )}
                  {gaps.playerBelow && (
                    <NeighborRow
                      label="Below"
                      name={gaps.playerBelow.display_name}
                      rank={gaps.playerBelow.rank}
                      diff={gaps.aheadOfNext ?? 0}
                      diffLabel="ahead"
                    />
                  )}
                </div>
              )}

              {!isMe && me && (
                <div className="mt-5 rounded-xl border border-default bg-card p-3">
                  <p className="type-overline !text-[10px]">Vs you</p>
                  <p className="mt-1 text-sm text-theme">
                    {me.total_points > entry.total_points && (
                      <>
                        You lead by{' '}
                        <span className="font-bold text-emerald-600">
                          {me.total_points - entry.total_points} pts
                        </span>
                      </>
                    )}
                    {me.total_points < entry.total_points && (
                      <>
                        They lead by{' '}
                        <span className="font-bold text-red-500">
                          {entry.total_points - me.total_points} pts
                        </span>
                      </>
                    )}
                    {me.total_points === entry.total_points && (
                      <span className="font-medium text-muted">Level on points</span>
                    )}
                    <span className="text-muted">
                      {' '}
                      · Rank #{me.rank} vs #{entry.rank}
                    </span>
                  </p>
                </div>
              )}

              {!isMe && onSetRival && (
                <button
                  type="button"
                  onClick={() => {
                    onSetRival(entry.user_id)
                    onClose()
                  }}
                  className="mt-5 w-full rounded-xl bg-simelabs py-3 text-sm font-semibold text-simelabs-foreground transition hover:opacity-90"
                >
                  Compare in head-to-head
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-default bg-muted/30 px-2 py-2.5 text-center">
      <p className="text-lg font-bold tabular-nums text-theme">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  )
}

function NeighborRow({
  label,
  name,
  rank,
  diff,
  diffLabel,
}: {
  label: string
  name: string
  rank: number
  diff: number
  diffLabel: 'behind' | 'ahead'
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted">{label}</span>
      <span className="min-w-0 flex-1 truncate text-right font-medium">{name}</span>
      <span className="shrink-0 tabular-nums text-muted">
        #{rank} · {diff} {diffLabel}
      </span>
    </div>
  )
}
