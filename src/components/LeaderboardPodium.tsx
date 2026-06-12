import { motion } from 'framer-motion'
import type { RankReveal } from '../hooks/useLeaderboardReveal'
import type { LeaderboardEntry } from '../lib/types'
import type { HeartTeamMap } from '../hooks/useLeaderboard'
import { LeaderboardAvatar } from './LeaderboardAvatar'
import { TruncatedText } from './TruncatedText'

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[]
  heartTeams?: HeartTeamMap
  currentUserId?: string
  rankReveal?: RankReveal | null
}

const PODIUM_ORDER = [2, 1, 3] as const

const podiumMeta = {
  1: {
    height: 'h-28',
    avatar: 'xl' as const,
    ring: 'ring-2 ring-simelabs/70',
    glow: 'shadow-glow',
    bar: 'bg-gradient-to-t from-simelabs-dark via-simelabs to-simelabs-light',
    rankBadge: 'bg-simelabs text-simelabs-foreground shadow-glow-sm',
    delay: 0.1,
  },
  2: {
    height: 'h-[4.5rem]',
    avatar: 'lg' as const,
    ring: 'ring-2 ring-simelabs/35',
    glow: '',
    bar: 'bg-gradient-to-t from-simelabs-dark/80 via-simelabs/55 to-simelabs/25',
    rankBadge: 'border border-simelabs/35 bg-simelabs/15 text-simelabs',
    delay: 0,
  },
  3: {
    height: 'h-12',
    avatar: 'lg' as const,
    ring: 'ring-2 ring-simelabs/15',
    glow: '',
    bar: 'bg-gradient-to-t from-simelabs-dark/60 via-simelabs/30 to-muted',
    rankBadge: 'border border-default bg-muted text-subtle',
    delay: 0.16,
  },
} as const

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        d="M6 4h12v2a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4V4Z"
        strokeLinejoin="round"
      />
      <path d="M8 10v1a4 4 0 0 0 8 0v-1" strokeLinecap="round" />
      <path d="M12 14v3M9 20h6M10 17h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 4H4a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2M19 4h1a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2" />
    </svg>
  )
}

function podiumEntryMotion(isMe: boolean, reveal: RankReveal | null | undefined) {
  if (!isMe || !reveal || reveal === 'same') {
    return { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 } }
  }
  const y = reveal === 'up' || reveal === 'debut' ? 32 : -16
  return { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 } }
}

function PodiumSlot({
  entry,
  rank,
  isMe,
  rankReveal,
  heartTeam,
}: {
  entry: LeaderboardEntry
  rank: 1 | 2 | 3
  isMe: boolean
  rankReveal?: RankReveal | null
  heartTeam?: string | null
}) {
  const meta = podiumMeta[rank]
  const motionProps = podiumEntryMotion(isMe, rankReveal)

  return (
    <motion.div
      {...motionProps}
      transition={{ type: 'spring', stiffness: 300, damping: 26, delay: meta.delay }}
      className="flex min-w-0 flex-1 flex-col items-center"
    >
      {rank === 1 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: meta.delay + 0.12 }}
          className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-simelabs/15 text-simelabs ring-1 ring-simelabs/30"
        >
          <TrophyIcon className="h-4 w-4" />
        </motion.div>
      )}

      <div
        className={`relative mb-2 rounded-full p-0.5 ${meta.ring} ${meta.glow} ${
          isMe ? 'ring-simelabs ring-offset-2 ring-offset-card' : ''
        }`}
      >
        <LeaderboardAvatar
          name={entry.display_name}
          avatarUrl={entry.avatar_url}
          heartTeam={heartTeam}
          size={meta.avatar}
        />
        <span
          className={`absolute -bottom-1 -right-1 z-20 flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-heading text-[11px] font-bold tabular-nums ${meta.rankBadge}`}
        >
          {rank}
        </span>
      </div>

      <TruncatedText
        text={entry.display_name}
        className={`max-w-[5.5rem] text-center text-xs font-semibold sm:max-w-[6.5rem] sm:text-sm ${
          isMe ? 'text-simelabs' : 'text-theme'
        }`}
      />
      {isMe && (
        <span className="type-caption text-[10px] font-semibold uppercase tracking-wider text-simelabs">
          You
        </span>
      )}

      <p className="type-stat mt-1 text-simelabs">
        {entry.total_points}
        <span className="ml-0.5 type-caption font-normal">pts</span>
      </p>

      <div
        className={`mt-2 flex w-full items-end justify-center rounded-t-xl border border-b-0 border-default/60 pb-2 ${meta.height} ${meta.bar}`}
      >
        <span className="font-heading text-sm font-bold tabular-nums text-simelabs-foreground/90">
          #{rank}
        </span>
      </div>
    </motion.div>
  )
}

export function LeaderboardPodium({
  entries,
  heartTeams = {},
  currentUserId,
  rankReveal,
}: LeaderboardPodiumProps) {
  const topThree = entries.filter((e) => e.rank <= 3).sort((a, b) => a.rank - b.rank)
  if (topThree.length === 0) return null

  const byRank = new Map(topThree.map((e) => [e.rank, e]))

  return (
    <section
      aria-label="Top three on the leaderboard"
      className="relative mb-6 overflow-hidden rounded-2xl border border-default bg-card shadow-card"
    >
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-simelabs/80 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-simelabs/10 blur-2xl"
        aria-hidden
      />

      <div className="relative border-b border-default/80 bg-gradient-to-b from-simelabs/8 to-transparent px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-simelabs to-simelabs-dark text-xs font-bold text-simelabs-foreground shadow-glow-sm">
            WC
          </div>
          <div className="text-center">
            <p className="type-overline !text-[10px]">Simelabs league</p>
            <h3 className="font-heading text-sm font-bold text-theme">Top three</h3>
          </div>
          <TrophyIcon className="h-5 w-5 text-simelabs" />
        </div>
      </div>

      <div className="relative flex items-end justify-center gap-2 px-3 pb-4 pt-5 sm:gap-4 sm:px-4">
        {PODIUM_ORDER.map((rank) => {
          const entry = byRank.get(rank)
          if (!entry) {
            return <div key={rank} className="min-w-0 flex-1" aria-hidden />
          }
          return (
            <PodiumSlot
              key={entry.user_id}
              entry={entry}
              rank={rank}
              isMe={entry.user_id === currentUserId}
              rankReveal={rankReveal}
              heartTeam={heartTeams[entry.user_id]}
            />
          )
        })}
      </div>
    </section>
  )
}
