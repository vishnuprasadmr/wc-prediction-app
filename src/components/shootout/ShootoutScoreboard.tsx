import { motion, AnimatePresence } from 'framer-motion'
import { LeaderboardAvatar } from '../LeaderboardAvatar'
import type { ArenaHero } from '../../lib/shootout/types'
import { heroShort } from '../../lib/shootout/hero'

interface ShootoutScoreboardProps {
  leftName: string
  rightName: string
  leftScore: number
  rightScore: number
  leftAvatar?: string | null
  rightAvatar?: string | null
  leftHero?: ArenaHero | null
  rightHero?: ArenaHero | null
  kickLabel?: string
}

export function ShootoutScoreboard({
  leftName,
  rightName,
  leftScore,
  rightScore,
  leftAvatar,
  rightAvatar,
  leftHero,
  rightHero,
  kickLabel,
}: ShootoutScoreboardProps) {
  return (
    <div className="rounded-2xl border border-default bg-gradient-to-r from-card via-muted/30 to-card p-3">
      {kickLabel && (
        <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
          {kickLabel}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <LeaderboardAvatar name={leftName} avatarUrl={leftAvatar} size="md" />
          <p className="w-full truncate text-center text-xs font-bold">{leftName}</p>
          <p className="text-[10px] text-muted">{heroShort(leftHero)}</p>
        </div>
        <div className="shrink-0 text-center">
          <p className="font-heading text-3xl font-black tabular-nums text-simelabs">
            {leftScore}
            <span className="mx-1 text-muted">–</span>
            {rightScore}
          </p>
          <p className="text-[10px] font-semibold uppercase text-muted">Shootout</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <LeaderboardAvatar name={rightName} avatarUrl={rightAvatar} size="md" />
          <p className="w-full truncate text-center text-xs font-bold">{rightName}</p>
          <p className="text-[10px] text-muted">{heroShort(rightHero)}</p>
        </div>
      </div>
    </div>
  )
}

interface KickResultOverlayProps {
  open: boolean
  outcome: 'goal' | 'save' | null
  line: string
  actorName: string
  actorAvatar?: string | null
  onDone: () => void
}

export function KickResultOverlay({
  open,
  outcome,
  line,
  actorName,
  actorAvatar,
  onDone,
}: KickResultOverlayProps) {
  return (
    <AnimatePresence>
      {open && outcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[260] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
          onClick={onDone}
        >
          <motion.div
            initial={{ scale: 0.7, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl ${
              outcome === 'goal'
                ? 'border-simelabs/50 bg-gradient-to-b from-simelabs/20 to-card'
                : 'border-amber-500/40 bg-gradient-to-b from-amber-500/15 to-card'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={outcome === 'goal' ? { y: [0, -8, 0] } : { x: [0, -6, 6, 0] }}
              transition={{ duration: 0.5 }}
            >
              <LeaderboardAvatar name={actorName} avatarUrl={actorAvatar} size="xl" />
            </motion.div>
            <p className="mt-3 text-lg font-bold">{actorName}</p>
            <p
              className={`mt-2 text-2xl font-black ${
                outcome === 'goal' ? 'text-simelabs' : 'text-amber-400'
              }`}
            >
              {outcome === 'goal' ? 'GOAL! ⚽' : 'SAVED! 🧤'}
            </p>
            <p className="mt-2 text-sm italic text-muted">{line}</p>
            <button
              type="button"
              onClick={onDone}
              className="mt-5 w-full rounded-xl bg-simelabs py-3 text-sm font-semibold text-simelabs-foreground"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
