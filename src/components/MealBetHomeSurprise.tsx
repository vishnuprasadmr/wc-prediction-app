import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from '../hooks/useMatches'
import { useMealChallenges } from '../hooks/useMealChallenges'
import { getOpenMealBetsForUser } from '../lib/mealBetNotifications'
import { isMatchLocked } from '../lib/matchUtils'
import { mealClaimOutcomeLabel } from '../lib/mealChallenges'
import { LockCountdown } from './LockCountdown'

const DISMISS_PREFIX = 'wc-meal-home-dismiss:'

function isDismissed(id: string): boolean {
  try {
    return localStorage.getItem(`${DISMISS_PREFIX}${id}`) === '1'
  } catch {
    return false
  }
}

function dismiss(id: string): void {
  try {
    localStorage.setItem(`${DISMISS_PREFIX}${id}`, '1')
  } catch {
    /* ignore */
  }
}

export function MealBetHomeSurprise() {
  const { user } = useAuth()
  const { matches } = useMatches()
  const { live, loading } = useMealChallenges(matches)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set())

  const visible = useMemo(() => {
    if (!user?.id || loading) return { bet: null as (typeof live)[0] | null, isOwn: false, moreCount: 0 }

    const openForUser = getOpenMealBetsForUser(live, user.id).filter(
      (c) => !isDismissed(c.id) && !hiddenIds.has(c.id),
    )
    if (openForUser.length > 0) {
      return { bet: openForUser[0], isOwn: false, moreCount: openForUser.length - 1 }
    }

    const ownLive = live.filter(
      (c) =>
        c.creator_id === user.id &&
        c.match &&
        !isMatchLocked(c.match) &&
        !isDismissed(c.id) &&
        !hiddenIds.has(c.id),
    )
    if (ownLive.length > 0) {
      return { bet: ownLive[0], isOwn: true, moreCount: ownLive.length - 1 }
    }

    return { bet: null, isOwn: false, moreCount: 0 }
  }, [user?.id, loading, live, hiddenIds])

  const { bet, isOwn, moreCount } = visible
  if (!bet?.match) return null

  return (
    <AnimatePresence>
      <motion.div
        key={bet.id}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="mb-4 overflow-hidden rounded-2xl border border-[#E23744]/40 bg-gradient-to-br from-[#E23744]/15 via-card to-amber-500/5 shadow-[0_8px_32px_rgb(226_55_68/0.12)]"
      >
        <div className="relative p-4">
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -right-4 -top-4 text-6xl opacity-20"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            🍽️
          </motion.span>

          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#E23744]">
              Meal bet live
            </p>
            <button
              type="button"
              onClick={() => {
                dismiss(bet.id)
                setHiddenIds((prev) => new Set(prev).add(bet.id))
              }}
              className="rounded-lg px-1.5 py-0.5 text-xs text-muted hover:bg-muted hover:text-theme"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>

          <p className="mt-2 text-lg font-bold leading-snug text-theme">
            {isOwn ? 'Your meal bet is live!' : `${bet.creator_name} called their shot!`}
          </p>
          <p className="mt-1 text-sm text-pretty text-muted">
            “{bet.claim_text}”
          </p>
          <p className="mt-2 text-xs text-muted">
            {bet.match.home_team} vs {bet.match.away_team} ·{' '}
            {mealClaimOutcomeLabel(bet.backed_outcome, bet.match)}
            {bet.acceptances.length > 0 && (
              <span className="text-amber-300">
                {' '}
                · {bet.acceptances.length} accepted ({bet.total_points_staked} pts)
              </span>
            )}
          </p>

          <div className="mt-3">
            <LockCountdown kickoffAt={bet.match.kickoff_at} variant="chip" />
            <p className="mt-1 text-[10px] text-muted">
              Point bets lock with predictions (15 min before kickoff)
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/meals"
              className="rounded-xl bg-[#E23744] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {isOwn ? 'View your bet' : 'Take the bet'}
            </Link>
            {moreCount > 0 && (
              <Link
                to="/meals"
                className="rounded-xl border border-default px-4 py-2.5 text-sm font-medium text-muted hover:text-theme"
              >
                +{moreCount} more live
              </Link>
            )}
          </div>
        </div>

        <motion.div
          className="h-0.5 bg-gradient-to-r from-[#E23744] via-amber-400 to-[#E23744]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
