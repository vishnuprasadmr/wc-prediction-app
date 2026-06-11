import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SCORING_RULES } from '../lib/scoring'

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

              <h2 className="text-lg font-bold">How Scoring Works</h2>
              <p className="mt-1 text-sm text-muted">Extended scoring for each match</p>

              <div className="mt-6 space-y-3">
                {SCORING_RULES.map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-center justify-between rounded-xl bg-muted p-4"
                  >
                    <div>
                      <p className="font-medium">{rule.label}</p>
                      <p className="text-xs text-muted">{rule.description}</p>
                    </div>
                    <span className="text-lg font-bold text-simelabs">{rule.points}</span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-xs text-muted">
                Up to 6 pts per match (5 exact + 1 early bird) · Up to 5 without exact score
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
