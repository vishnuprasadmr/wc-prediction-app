import { motion } from 'framer-motion'
import { useSeasonEditPoll } from '../hooks/useSeasonEditPoll'
import { useSeasonQuestionnaireContext } from '../contexts/SeasonQuestionnaireContext'
import { formatSeasonEditLockHint } from '../lib/seasonEditPoll'
import { useMatches } from '../hooks/useMatches'
import { isSeasonEditRevealDismissed } from '../lib/seasonEditPoll'

/** Slim CTA after the full reveal is dismissed — stays until QF lock. */
export function SeasonEditWindowBanner() {
  const { matches } = useMatches()
  const { editAllowed, poll, showPublishedReveal } = useSeasonEditPoll()
  const { canEditSeasonPicks, openSeasonEdit } = useSeasonQuestionnaireContext()

  if (!editAllowed || !canEditSeasonPicks) return null
  // Hide while full reveal is still visible
  if (showPublishedReveal && poll.published_at && !isSeasonEditRevealDismissed(poll.published_at)) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-amber-300">Season picks reopen before QF</p>
        <p className="type-caption mt-1 text-muted">{formatSeasonEditLockHint(matches)}</p>
      </div>
      <button
        type="button"
        onClick={openSeasonEdit}
        className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400"
      >
        Edit picks
      </button>
    </motion.div>
  )
}
