import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useSeasonEditPoll } from '../hooks/useSeasonEditPoll'
import { useSeasonQuestionnaireContext } from '../contexts/SeasonQuestionnaireContext'
import {
  dismissSeasonEditReveal,
  formatSeasonEditLockHint,
  isSeasonEditRevealDismissed,
} from '../lib/seasonEditPoll'
import { useMatches } from '../hooks/useMatches'
import { playSound } from '../lib/sounds'

export function SeasonEditPollReveal() {
  const { matches } = useMatches()
  const { showPublishedReveal, poll, tallies, editAllowed } = useSeasonEditPoll()
  const { canEditSeasonPicks, openSeasonEdit, hasSubmitted } = useSeasonQuestionnaireContext()
  const reduceMotion = useReducedMotion()
  const [dismissed, setDismissed] = useState(true)
  const [celebrated, setCelebrated] = useState(false)

  useEffect(() => {
    if (!showPublishedReveal || !poll.published_at) {
      setDismissed(true)
      return
    }
    setDismissed(isSeasonEditRevealDismissed(poll.published_at))
  }, [showPublishedReveal, poll.published_at])

  const visible = showPublishedReveal && !dismissed

  useEffect(() => {
    if (!visible || celebrated || reduceMotion) return
    setCelebrated(true)
    playSound('save')
    confetti({
      particleCount: 80,
      spread: 68,
      origin: { y: 0.35 },
      colors: ['#26cb99', '#f59e0b', '#ffffff'],
    })
  }, [visible, celebrated, reduceMotion])

  if (!visible) return null

  const majorityYes = tallies.yes >= tallies.no
  const editOpen = editAllowed && hasSubmitted

  const close = () => {
    dismissSeasonEditReveal(poll.published_at)
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        key={poll.published_at ?? 'reveal'}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="mb-4 overflow-hidden rounded-2xl border border-simelabs/40 bg-gradient-to-br from-simelabs/20 via-card to-amber-500/10 shadow-[0_10px_36px_rgb(38_203_153/0.18)]"
        role="dialog"
        aria-label="Season edit poll results"
      >
        <div className="relative p-4">
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 rounded-lg px-1.5 py-0.5 text-xs text-muted hover:bg-muted hover:text-theme"
            aria-label="Dismiss"
          >
            ✕
          </button>

          <p className="text-[10px] font-bold uppercase tracking-widest text-simelabs">
            Poll results · season specials
          </p>
          <motion.h2
            className="mt-2 text-xl font-bold leading-snug text-theme"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {majorityYes ? 'League wants the re-edit window' : 'League leans keep locked'}
          </motion.h2>
          <p className="mt-1 text-sm text-muted">{poll.question}</p>

          <div className="mt-4 space-y-3">
            <VoteBar label="Yes — reopen" pct={tallies.yesPct} count={tallies.yes} tone="yes" />
            <VoteBar label="No — keep locked" pct={tallies.noPct} count={tallies.no} tone="no" />
          </div>

          <p className="type-caption mt-3 text-center text-muted">
            {tallies.total} vote{tallies.total === 1 ? '' : 's'} counted
            {editOpen
              ? ` · ${formatSeasonEditLockHint(matches)}`
              : poll.edit_window_open
                ? ' · Edit window is open — complete your season picks first from Profile'
                : ' · Waiting for admin to open the edit window'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {canEditSeasonPicks && (
              <button
                type="button"
                onClick={() => {
                  playSound('select')
                  openSeasonEdit()
                  close()
                }}
                className="rounded-xl bg-simelabs px-4 py-2.5 text-sm font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark"
              >
                Edit my season picks
              </button>
            )}
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-default px-4 py-2.5 text-sm font-medium text-muted hover:text-theme"
            >
              Got it
            </button>
          </div>
        </div>

        <motion.div
          className="h-1 origin-left bg-gradient-to-r from-simelabs via-amber-400 to-simelabs"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </motion.div>
    </AnimatePresence>
  )
}

function VoteBar({
  label,
  pct,
  count,
  tone,
}: {
  label: string
  pct: number
  count: number
  tone: 'yes' | 'no'
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium">
        <span className="text-theme">{label}</span>
        <span className={tone === 'yes' ? 'text-simelabs' : 'text-muted'}>
          {pct}% · {count}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full ${
            tone === 'yes'
              ? 'bg-gradient-to-r from-simelabs-dark to-simelabs'
              : 'bg-gradient-to-r from-zinc-500 to-zinc-400'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.85, ease: 'easeOut', delay: tone === 'yes' ? 0.2 : 0.35 }}
        />
      </div>
    </div>
  )
}
