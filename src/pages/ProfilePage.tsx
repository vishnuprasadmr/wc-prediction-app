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
import { SeasonPicksCard } from '../components/SeasonPicksCard'
import { useSeasonQuestionnaire } from '../hooks/useSeasonQuestionnaire'
import { ProfileAvatar } from '../components/ProfileAvatar'
import { TeamFlag } from '../components/TeamFlag'
import { BadgesRow } from '../components/BadgesRow'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { computeBadges } from '../lib/badges'
import { PredictionBreakdownList } from '../components/PredictionBreakdownList'
import { SeasonTrackerCard } from '../components/SeasonTrackerCard'
import { ShareStandingsButton } from '../components/ShareStandingsButton'
import { NotificationSettings } from '../components/NotificationSettings'
import { DepartmentSelect } from '../components/DepartmentSelect'
import { GloryOptIn } from '../components/GloryOptIn'

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth()
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

  const badges = useMemo(() => computeBadges(predictions), [predictions])
  const { canInstallNatively, install, instructions, isStandalone } = usePwaInstall()
  const totalPoints = rankingsAvailable ? (myEntry?.total_points ?? 0) : 0
  const rank = rankingsAvailable ? (myEntry?.rank ?? 0) : 0
  const exactScores = rankingsAvailable ? (myEntry?.exact_scores ?? 0) : 0

  const lastFinished = useMemo(
    () =>
      predictions.find(
        (p) => p.match?.status === 'finished' && p.points_earned !== null,
      ),
    [predictions],
  )

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-default bg-card p-6 text-center shadow-card"
      >
        <ProfileAvatar
          name={profile?.display_name ?? 'Player'}
          avatarUrl={profile?.avatar_url}
          size="lg"
          className="mx-auto ring-2 ring-simelabs/30"
        />
        <h2 className="type-page-title mt-3 break-words">{profile?.display_name}</h2>
        <p className="type-body-sm mt-1 break-all text-muted">{user?.email}</p>
        {profile?.employee_id && (
          <p className="type-caption mt-1 font-mono text-simelabs">{profile.employee_id}</p>
        )}
        {heartTeam && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-simelabs/10 px-2.5 py-1">
            <TeamFlag team={heartTeam} emoji="" size="sm" />
            <span className="text-xs font-medium text-simelabs">Backing {heartTeam}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-4">
          <Stat label="Rank" value={rankingsAvailable ? String(rank) : '—'} />
          <Stat label="Points" value={String(totalPoints)} highlight />
          <Stat label="Exact" value={String(exactScores)} />
        </div>
      </motion.div>

      <div>
        <h3 className="type-section-title mb-2">Badges</h3>
        <BadgesRow badges={badges} />
      </div>

      {rankingsAvailable && rank > 0 && (
        <ShareStandingsButton
          displayName={profile?.display_name ?? 'Player'}
          rank={rank}
          totalPoints={totalPoints}
          exactScores={exactScores}
          lastPrediction={lastFinished}
        />
      )}

      <SeasonPicksCard
        answers={seasonRow?.answers}
        pointsEarned={seasonRow?.points_earned}
        loading={seasonLoading}
      />

      <SeasonTrackerCard />

      <PredictionBreakdownList predictions={predictions} />

      <DepartmentSelect value={profile?.department} onSaved={() => void refreshProfile()} />
      <GloryOptIn
        value={profile?.glory_opt_in ?? false}
        onSaved={() => void refreshProfile()}
      />

      <NotificationSettings />

      <Link
        to="/widget"
        className="flex w-full items-center justify-between rounded-xl bg-card p-4 transition hover:bg-muted"
      >
        <span>📱 Home screen glance</span>
        <span className="text-sm text-simelabs">→</span>
      </Link>

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
          {isStandalone ? (
            <p className="type-caption text-simelabs">Installed — you&apos;re using the app.</p>
          ) : (
            <>
              <p className="type-caption text-pretty">{instructions}</p>
              {canInstallNatively && (
                <button
                  type="button"
                  onClick={() => void install()}
                  className="mt-3 w-full rounded-xl bg-simelabs py-2.5 text-sm font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark"
                >
                  Install app
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="type-section-title mb-3">Your Predictions</h3>
        {loading && predictions.length === 0 ? (
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
                className="flex items-start justify-between gap-2 rounded-xl bg-card p-3 text-sm"
              >
                <p className="min-w-0 flex-1 text-balance text-sm leading-snug">
                  {p.match?.home_team ?? 'Home'} vs {p.match?.away_team ?? 'Away'}
                </p>
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
