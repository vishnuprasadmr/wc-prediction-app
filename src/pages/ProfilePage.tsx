import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useMatches } from '../hooks/useMatches'
import { hasFinishedMatches } from '../lib/leaderboardUtils'
import { useUserPredictions } from '../hooks/usePredictions'
import { ScoringRulesSheet } from '../components/ScoringRulesSheet'
import { ThemePreferenceRow } from '../components/ThemePreferenceRow'
import { useState } from 'react'
import { TruncatedText } from '../components/TruncatedText'
import { SeasonPicksCard } from '../components/SeasonPicksCard'
import { useSeasonQuestionnaire } from '../hooks/useSeasonQuestionnaire'
import { TeamFlag } from '../components/TeamFlag'

export function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const { matches } = useMatches()
  const { entries } = useLeaderboard()
  const { predictions, loading } = useUserPredictions(user?.id)
  const [showRules, setShowRules] = useState(false)
  const { row: seasonRow, loading: seasonLoading } = useSeasonQuestionnaire()
  const heartTeam = seasonRow?.answers?.heart_team

  const rankingsAvailable = useMemo(() => hasFinishedMatches(matches), [matches])

  const myEntry = useMemo(
    () => entries.find((e) => e.user_id === user?.id),
    [entries, user?.id],
  )

  const totalPoints = rankingsAvailable ? (myEntry?.total_points ?? 0) : 0
  const rank = rankingsAvailable ? String(myEntry?.rank ?? '—') : '—'
  const exactScores = rankingsAvailable ? (myEntry?.exact_scores ?? 0) : 0

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-default bg-card p-6 text-center shadow-card"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-simelabs to-simelabs-dark text-2xl font-bold text-simelabs-foreground">
          {profile?.display_name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <h2 className="type-page-title mt-3 break-words">{profile?.display_name}</h2>
        <p className="type-body-sm mt-1 break-all text-muted">{user?.email}</p>
        {heartTeam && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-simelabs/10 px-2.5 py-1">
            <TeamFlag team={heartTeam} emoji="" size="sm" />
            <span className="text-xs font-medium text-simelabs">Backing {heartTeam}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-4">
          <Stat label="Rank" value={String(rank)} />
          <Stat label="Points" value={String(totalPoints)} highlight />
          <Stat label="Exact" value={String(exactScores)} />
        </div>
      </motion.div>

      <SeasonPicksCard
        answers={seasonRow?.answers}
        pointsEarned={seasonRow?.points_earned}
        loading={seasonLoading}
      />

      <ThemePreferenceRow />

      <div className="space-y-2">
        <button
          onClick={() => setShowRules(true)}
          className="flex w-full items-center justify-between rounded-xl bg-card p-4 text-left transition hover:bg-muted"
        >
          <span>📋 How scoring works</span>
          <span className="text-muted">→</span>
        </button>

        {profile?.is_admin && (
          <Link
            to="/admin"
            className="flex w-full items-center justify-between rounded-xl bg-card p-4 transition hover:bg-muted"
          >
            <span>⚙️ Admin panel</span>
            <span className="text-muted">→</span>
          </Link>
        )}

        <div className="rounded-xl bg-card p-4">
          <p className="type-label mb-1">📲 Install on your phone</p>
          <p className="type-caption text-pretty">
            iOS: Share → Add to Home Screen.
            <span className="mt-0.5 block sm:inline">
              <span className="hidden sm:inline"> </span>
              Android: Use the install banner or browser menu.
            </span>
          </p>
        </div>
      </div>

      <div>
        <h3 className="type-section-title mb-3">Your Predictions</h3>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : predictions.length === 0 ? (
          <p className="text-sm text-muted">No predictions yet. Head to Predict!</p>
        ) : (
          <div className="space-y-2">
            {predictions.slice(0, 10).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-card p-3 text-sm"
              >
                <TruncatedText
                  text={`${p.match?.home_team ?? 'Home'} vs ${p.match?.away_team ?? 'Away'}`}
                  className="min-w-0 flex-1 text-sm"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-medium">
                    {p.home_pred}-{p.away_pred}
                  </span>
                  {p.points_earned !== null && (
                    <span className="flex items-center gap-1">
                      <span className="rounded-full bg-simelabs/20 px-2 py-0.5 text-xs font-bold text-simelabs">
                        +{p.points_earned}
                      </span>
                      {(p.first_bonus ?? 0) > 0 && (
                        <span className="text-[10px] font-semibold text-simelabs">early</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => signOut()}
        className="w-full rounded-xl border border-red-500/30 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
      >
        Sign Out
      </button>

      <ScoringRulesSheet open={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className={`type-stat ${highlight ? 'text-simelabs' : ''}`}>{value}</p>
      <p className="type-caption mt-1">{label}</p>
    </div>
  )
}
