import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSeasonQuestionnaireContext } from '../contexts/SeasonQuestionnaireContext'
import { useMatches } from '../hooks/useMatches'
import { formatSeasonQuestionnaireLockHint } from '../lib/seasonQuestionnaireLock'
import { MAX_SEASON_BONUS } from '../lib/seasonQuestions'

export function SeasonPicksReminder() {
  const { matches } = useMatches()
  const { needsSeasonPicks, openQuestionnaire } = useSeasonQuestionnaireContext()

  return (
    <AnimatePresence>
      {needsSeasonPicks && (
        <motion.aside
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-4 overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-500/10 via-card to-card shadow-card"
          role="status"
        >
          <div className="h-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="type-overline !text-amber-500">Season picks required</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-theme">
                Complete Golden Boot, winner &amp; more before match predictions
              </p>
              <p className="type-caption mt-1 text-pretty text-muted">
                Up to {MAX_SEASON_BONUS} bonus pts · {formatSeasonQuestionnaireLockHint(matches)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={openQuestionnaire}
                className="rounded-xl bg-simelabs px-4 py-2 text-xs font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark"
              >
                Complete now
              </button>
              <Link
                to="/profile"
                className="rounded-xl border border-default px-4 py-2 text-xs font-semibold text-muted transition hover:bg-muted hover:text-theme"
              >
                Profile
              </Link>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
