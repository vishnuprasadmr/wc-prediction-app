import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import type { LeaderboardEntry } from '../lib/types'
import { playSound } from '../lib/sounds'
import { LeaderboardAvatar } from './LeaderboardAvatar'
import { TruncatedText } from './TruncatedText'

export function HeadToHeadCard({
  entries,
  heartTeams,
}: {
  entries: LeaderboardEntry[]
  heartTeams: Record<string, string>
}) {
  const { user } = useAuth()
  const [rivalId, setRivalId] = useState<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const me = useMemo(
    () => entries.find((e) => e.user_id === user?.id),
    [entries, user?.id],
  )

  const rivals = useMemo(
    () => entries.filter((e) => e.user_id !== user?.id),
    [entries, user?.id],
  )

  const rival = rivals.find((e) => e.user_id === rivalId) ?? rivals[0]
  const rivalIndex = rival ? rivals.findIndex((r) => r.user_id === rival.user_id) : 0

  useEffect(() => {
    if (!rivalId && rivals[0]) {
      setRivalId(rivals[0].user_id)
    }
  }, [rivalId, rivals])

  const pickRival = (id: string) => {
    playSound('select')
    setRivalId(id)
  }

  const cycleRival = (dir: -1 | 1) => {
    if (rivals.length === 0) return
    const next = (rivalIndex + dir + rivals.length) % rivals.length
    pickRival(rivals[next].user_id)
    scrollRef.current
      ?.querySelector(`[data-rival-id="${rivals[next].user_id}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  if (!me || rivals.length === 0) return null

  const diff = me.total_points - (rival?.total_points ?? 0)
  const winning = diff > 0
  const losing = diff < 0

  return (
    <div className="overflow-hidden rounded-2xl border border-default bg-card shadow-card">
      {/* Pitch strip */}
      <div className="relative border-b border-simelabs/20 bg-gradient-to-r from-simelabs/15 via-simelabs/5 to-simelabs/15 px-4 py-3">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 18px, currentColor 18px, currentColor 19px)',
          }}
        />
        <div className="relative flex items-center justify-between gap-2">
          <div>
            <p className="type-overline !text-[10px] !text-simelabs">Matchday</p>
            <h3 className="type-section-title">Head to head</h3>
          </div>
          <span className="rounded-full border border-simelabs/30 bg-simelabs/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-simelabs">
            Friendly
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="type-caption mb-2 font-medium text-muted">Choose your rival</p>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {rivals.map((r) => {
            const selected = r.user_id === rival?.user_id
            return (
              <button
                key={r.user_id}
                type="button"
                data-rival-id={r.user_id}
                onClick={() => pickRival(r.user_id)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-2.5 py-2 text-left transition ${
                  selected
                    ? 'border-simelabs/50 bg-simelabs/12 shadow-glow-sm ring-1 ring-simelabs/30'
                    : 'border-default bg-muted/40 hover:border-simelabs/25 hover:bg-muted'
                }`}
              >
                <LeaderboardAvatar
                  name={r.display_name}
                  avatarUrl={r.avatar_url}
                  heartTeam={heartTeams[r.user_id]}
                  size="sm"
                  ringClassName={selected ? 'ring-2 ring-simelabs/40' : ''}
                />
                <div className="min-w-0 max-w-[6.5rem]">
                  <TruncatedText text={r.display_name} className="text-xs font-semibold" />
                  <p className="text-[10px] font-medium text-muted">
                    Rank #{r.rank} · {r.total_points} pts
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {rival && (
          <div className="relative mt-5 overflow-hidden rounded-2xl border border-default bg-gradient-to-b from-muted/30 to-card">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-default" aria-hidden />

            <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-3 py-5 sm:px-4">
              {/* You */}
              <div className="text-center">
                <p className="type-overline mb-2 !text-[9px] !text-simelabs">You</p>
                <div className="mx-auto w-fit">
                  <LeaderboardAvatar
                    name={me.display_name}
                    avatarUrl={me.avatar_url}
                    heartTeam={heartTeams[me.user_id]}
                    size="md"
                    ringClassName="ring-2 ring-simelabs/35"
                  />
                </div>
                <p className="mt-2 truncate px-1 text-xs font-bold">{me.display_name}</p>
                <p className="mt-0.5 font-heading text-2xl font-black tabular-nums text-simelabs">
                  {me.total_points}
                </p>
              </div>

              {/* Centre badge */}
              <div className="flex flex-col items-center px-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-default bg-card font-heading text-sm font-black text-muted shadow-card">
                  VS
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${rival.user_id}-${diff}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`mt-2 text-sm font-bold tabular-nums ${
                      winning ? 'text-emerald-600' : losing ? 'text-red-500' : 'text-muted'
                    }`}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Rival — cycle with arrows */}
              <div className="text-center">
                <p className="type-overline mb-2 !text-[9px]">Rival</p>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => cycleRival(-1)}
                    aria-label="Previous rival"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-default bg-card text-sm text-muted transition hover:border-simelabs/40 hover:text-simelabs"
                  >
                    ‹
                  </button>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={rival.user_id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    >
                      <LeaderboardAvatar
                        name={rival.display_name}
                        avatarUrl={rival.avatar_url}
                        heartTeam={heartTeams[rival.user_id]}
                        size="md"
                      />
                    </motion.div>
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={() => cycleRival(1)}
                    aria-label="Next rival"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-default bg-card text-sm text-muted transition hover:border-simelabs/40 hover:text-simelabs"
                  >
                    ›
                  </button>
                </div>
                <p className="mt-2 truncate px-1 text-xs font-bold">{rival.display_name}</p>
                <p className="mt-0.5 font-heading text-2xl font-black tabular-nums">
                  {rival.total_points}
                </p>
              </div>
            </div>

            <div className="border-t border-default px-4 py-2 text-center">
              <p className="type-caption text-muted">
                {winning && `You're ${diff} pts ahead of ${rival.display_name}`}
                {losing && `${rival.display_name} leads by ${Math.abs(diff)} pts`}
                {!winning && !losing && "Dead level on points"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
