import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { InstallPrompt } from './InstallPrompt'
import { ThemeToggle } from './ThemeToggle'
import { EngagementPrompt } from './EngagementPrompt'
import { MatchesProvider } from '../contexts/MatchesContext'
import { QuestionnaireGate } from './QuestionnaireGate'

export function Layout() {
  return (
    <MatchesProvider>
    <QuestionnaireGate>
    <div className="page-shell safe-top pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
      <header className="page-content sticky top-0 z-40 border-b border-default bg-elevated/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <h1 className="type-page-title">
              <span className="text-simelabs">Simelabs</span>{' '}
              <span className="text-theme">WC 26</span>
            </h1>
            <p className="type-caption leading-snug">
              Prediction League
              <span className="text-muted/50"> · </span>
              <span className="whitespace-nowrap">All times IST</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-simelabs to-simelabs-dark text-sm font-bold text-simelabs-foreground shadow-glow-sm">
              WC
            </div>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="page-content mx-auto max-w-lg px-4 py-4"
      >
        <Outlet />
      </motion.main>

      <EngagementPrompt />
      <BottomNav />
      <InstallPrompt />
    </div>
    </QuestionnaireGate>
    </MatchesProvider>
  )
}
