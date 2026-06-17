import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { buildLeaderNarrative } from '../lib/leaderNarrative'
import { canViewSimelabsLeaderboard } from '../lib/employeeId'
import { hasFinishedMatches } from '../lib/leaderboardUtils'
import { useMatches } from '../hooks/useMatches'

export function LeaderNarrativeBanner() {
  const { profile } = useAuth()
  const { matches } = useMatches()
  const tournamentStarted = useMemo(() => hasFinishedMatches(matches, 'all'), [matches])
  const league = canViewSimelabsLeaderboard(profile) ? 'simelabs' : 'global'
  const { entries, loading } = useLeaderboard('all', league)

  const narrative = useMemo(() => {
    if (!tournamentStarted || entries.length < 2) return null
    return buildLeaderNarrative(entries)
  }, [entries, tournamentStarted])

  if (loading || !narrative) return null

  const leader = entries[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="relative mb-4 overflow-hidden rounded-2xl border border-simelabs/30 bg-gradient-to-r from-simelabs/10 via-card to-amber-400/5 p-4 shadow-card"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-40"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage:
            'linear-gradient(90deg, transparent, rgb(38 203 153 / 0.12), transparent)',
          backgroundSize: '200% 100%',
        }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="type-overline text-simelabs">League pulse</p>
          <motion.p
            key={narrative}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-1 text-sm font-semibold leading-snug text-theme sm:text-base"
          >
            {narrative}
          </motion.p>
          {leader && (
            <p className="mt-1 text-xs text-muted">
              #{leader.rank} {leader.display_name} · {leader.total_points} pts
            </p>
          )}
        </div>
        <Link
          to="/leaderboard"
          className="shrink-0 rounded-xl bg-simelabs/15 px-3 py-2 text-xs font-bold text-simelabs transition hover:bg-simelabs/25"
        >
          Point table →
        </Link>
      </div>
    </motion.div>
  )
}
