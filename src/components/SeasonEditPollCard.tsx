import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSeasonEditPoll } from '../hooks/useSeasonEditPoll'
import { playSound } from '../lib/sounds'
import type { SeasonEditPollVote } from '../lib/seasonEditPoll'

export function SeasonEditPollCard() {
  const { showPollCard, poll, myVote, tallies, castVote, saving } = useSeasonEditPoll()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<SeasonEditPollVote | null>(null)

  if (!showPollCard) return null

  const vote = async (choice: SeasonEditPollVote) => {
    setError(null)
    setPending(choice)
    try {
      playSound('select')
      await castVote(choice)
      playSound('save')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save vote')
    } finally {
      setPending(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className="mb-4 overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/15 via-card to-simelabs/10 shadow-[0_8px_28px_rgb(245_158_11/0.12)]"
    >
      <div className="relative p-4">
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -right-2 -top-2 text-5xl opacity-25"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          🗳️
        </motion.span>

        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
          League poll · before QF
        </p>
        <p className="mt-2 text-lg font-bold leading-snug text-theme">{poll.question}</p>
        <p className="mt-1 text-sm text-muted">
          Golden Boot, World Cup winner, dark horse &amp; more — cast your vote. Admin publishes the
          result.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={saving || pending !== null}
            onClick={() => void vote('yes')}
            className={`rounded-xl px-3 py-3 text-sm font-semibold transition disabled:opacity-60 ${
              myVote === 'yes'
                ? 'bg-simelabs text-simelabs-foreground ring-2 ring-simelabs/50'
                : 'border border-simelabs/40 bg-simelabs/15 text-simelabs hover:bg-simelabs/25'
            }`}
          >
            {pending === 'yes' ? '…' : myVote === 'yes' ? 'Yes ✓' : 'Yes — reopen edits'}
          </button>
          <button
            type="button"
            disabled={saving || pending !== null}
            onClick={() => void vote('no')}
            className={`rounded-xl px-3 py-3 text-sm font-semibold transition disabled:opacity-60 ${
              myVote === 'no'
                ? 'bg-muted text-theme ring-2 ring-default'
                : 'border border-default bg-card text-subtle hover:bg-muted'
            }`}
          >
            {pending === 'no' ? '…' : myVote === 'no' ? 'No ✓' : 'No — keep locked'}
          </button>
        </div>

        {myVote && (
          <p className="type-caption mt-3 text-center text-muted">
            You voted{' '}
            <span className="font-semibold text-theme">{myVote === 'yes' ? 'Yes' : 'No'}</span>
            {tallies.total > 0 && (
              <>
                {' '}
                · {tallies.total} vote{tallies.total === 1 ? '' : 's'} so far
              </>
            )}
            . Change anytime while the poll is open.
          </p>
        )}

        {error && (
          <p className="mt-2 text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
      <motion.div
        className="h-0.5 bg-gradient-to-r from-amber-400 via-simelabs to-amber-400"
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
    </motion.div>
  )
}
