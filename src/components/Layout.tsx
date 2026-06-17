import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { BottomNav } from './BottomNav'
import { GameNotificationHost } from './GameNotificationHost'
import { InstallPrompt } from './InstallPrompt'
import { ThemeToggle } from './ThemeToggle'
import { LeaderNarrativeBanner } from './LeaderNarrativeBanner'
import { EngagementPrompt } from './EngagementPrompt'
import { useMemo } from 'react'
import { BadgeUnlockModal } from './BadgeUnlockModal'
import { OracleMomentOverlay } from './OracleMomentOverlay'
import { MatchesProvider } from '../contexts/MatchesContext'
import { QuestionnaireGate } from './QuestionnaireGate'
import { SeasonPicksReminder } from './SeasonPicksReminder'
import { useBadgeUnlock } from '../hooks/useBadgeUnlock'
import { useMatchResultNotifications } from '../hooks/useMatchResultNotifications'
import { useOracleMoment } from '../hooks/useOracleMoment'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useUserPredictions } from '../hooks/usePredictions'
import { useAuth } from '../contexts/AuthContext'
import { computeBadges } from '../lib/badges'

function EngagementHooks() {
  useMatchResultNotifications()
  const { moment, dismiss } = useOracleMoment()
  const { user, profile } = useAuth()
  const { entries } = useLeaderboard()
  const { predictions, loading: predictionsLoading } = useUserPredictions(user?.id)
  const badges = useMemo(() => computeBadges(predictions), [predictions])
  const { unlocking, dismissUnlock } = useBadgeUnlock(badges, {
    ready: Boolean(user?.id) && !predictionsLoading,
    userId: user?.id,
  })
  const myEntry = entries.find((e) => e.user_id === profile?.id)

  return (
    <>
      <OracleMomentOverlay
        moment={moment}
        onDismiss={dismiss}
        displayName={profile?.display_name}
        rank={myEntry?.rank}
        totalPoints={myEntry?.total_points}
        exactScores={myEntry?.exact_scores}
      />
      <BadgeUnlockModal badge={unlocking} onDismiss={dismissUnlock} />
    </>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <MatchesProvider>
    <QuestionnaireGate>
    <EngagementHooks />
    <GameNotificationHost />
    <div className="page-shell flex min-h-dvh pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
      <AppSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="page-content flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-default bg-elevated/95 backdrop-blur-md safe-top">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-default bg-muted text-theme transition hover:border-simelabs/35 hover:bg-simelabs/10 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <div className="min-w-0 lg:hidden">
                <h1 className="type-page-title truncate">
                  <span className="text-simelabs">Simelabs</span>{' '}
                  <span className="text-theme">WC 26</span>
                </h1>
                <p className="type-caption leading-snug text-muted">Prediction League</p>
              </div>
              <div className="hidden min-w-0 lg:block">
                <p className="type-caption text-muted">All times IST</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-simelabs to-simelabs-dark text-sm font-bold text-simelabs-foreground shadow-glow-sm sm:flex">
                WC
              </div>
            </div>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-4"
        >
          <SeasonPicksReminder />
          <LeaderNarrativeBanner />
          <Outlet />
        </motion.main>

        <EngagementPrompt />
        <InstallPrompt />
      </div>
    </div>
    <div className="lg:hidden">
      <BottomNav onOpenMenu={() => setSidebarOpen(true)} />
    </div>
    </QuestionnaireGate>
    </MatchesProvider>
  )
}
