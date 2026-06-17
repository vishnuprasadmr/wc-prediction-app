import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ENGAGEMENT_BONUS_RULES } from '../lib/engagementBonuses'
import { SCORING_RULES } from '../lib/scoring'
import { SEASON_SCORING_RULES } from '../lib/seasonScoring'
import { MAX_SEASON_BONUS } from '../lib/seasonQuestions'

interface ScoringRulesSheetProps {
  open: boolean
  onClose: () => void
}

export function ScoringRulesSheet({ open, onClose }: ScoringRulesSheetProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[100] mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-t-3xl border border-default bg-card shadow-2xl"
          >
            <div className="p-6 pb-8">
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" />

              <h2 className="type-section-title">How Scoring Works</h2>
              <p className="type-body-sm mt-1 text-muted">Match picks + season specials</p>

              <h3 className="type-label mt-6 mb-2">Per match</h3>
              <div className="space-y-3">
                {SCORING_RULES.map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-center justify-between rounded-xl bg-muted p-4"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium">{rule.label}</p>
                      <p className="text-xs text-muted text-pretty">{rule.description}</p>
                    </div>
                    <span className="shrink-0 text-lg font-bold text-simelabs">{rule.points}</span>
                  </div>
                ))}
              </div>

              <h3 className="type-label mt-6 mb-2">Season specials (after Final)</h3>
              <p className="type-caption mb-3 text-pretty">
                Pre-tournament picks — up to {MAX_SEASON_BONUS} bonus pts can change who wins the
                league.
              </p>
              <div className="space-y-3">
                {SEASON_SCORING_RULES.map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-center justify-between rounded-xl border border-simelabs/20 bg-simelabs/5 p-4"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="flex flex-wrap items-center gap-1.5 font-medium">
                        <span>{rule.label}</span>
                        <span className="rounded-full bg-simelabs/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-simelabs">
                          {rule.badge}
                        </span>
                      </p>
                      <p className="text-xs text-muted text-pretty">{rule.description}</p>
                    </div>
                    <span className="shrink-0 text-lg font-bold text-simelabs">{rule.points}</span>
                  </div>
                ))}
              </div>

              <h3 className="type-label mt-6 mb-2">Engagement bonuses</h3>
              <p className="type-caption mb-3 text-pretty">
                Small one-time boosts — count toward your total and meal-bet stakes.
              </p>
              <div className="space-y-3">
                {ENGAGEMENT_BONUS_RULES.map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="flex flex-wrap items-center gap-1.5 font-medium">
                        <span>{rule.label}</span>
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                          {rule.badge}
                        </span>
                      </p>
                      <p className="text-xs text-muted text-pretty">{rule.description}</p>
                    </div>
                    <span className="shrink-0 text-lg font-bold text-emerald-400">{rule.points}</span>
                  </div>
                ))}
              </div>

              <p className="type-caption mt-4 text-center text-pretty">
                Up to 6 pts per match (5 exact + 1 early bird)
                <span className="block sm:inline">
                  <span className="hidden sm:inline text-muted/50"> · </span>
                  + up to {MAX_SEASON_BONUS} season bonus
                </span>
              </p>

              <button
                onClick={onClose}
                className="mt-6 w-full rounded-xl bg-simelabs py-3 text-sm font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark"
              >
                Got it
              </button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
