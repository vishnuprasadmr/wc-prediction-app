import { AnimatePresence, motion } from 'framer-motion'
import { TeamFlag } from './TeamFlag'
import {
  getLeaderboardPromptMessage,
  getMealBetPromptMessage,
  getPredictPromptMessage,
} from '../lib/engagementPrompts'
import { useEngagementPrompt } from '../hooks/useEngagementPrompt'
import { usePredictionLockAlert } from '../hooks/usePredictionLockAlert'
import { LockCountdown } from './LockCountdown'

export function EngagementPrompt() {
  usePredictionLockAlert()

  const {
    prompt,
    dismiss,
    goToAction,
    requestNotifications,
    notificationsSupported,
    notificationsEnabled,
  } = useEngagementPrompt()

  const message = prompt
    ? prompt.kind === 'predict'
      ? getPredictPromptMessage(prompt)
      : prompt.kind === 'meal'
        ? getMealBetPromptMessage(prompt)
        : getLeaderboardPromptMessage(prompt)
    : null

  const actionLabel =
    prompt?.kind === 'predict'
      ? 'Predict now'
      : prompt?.kind === 'meal'
        ? 'View meal bet'
        : 'View table'
  const emoji =
    prompt?.kind === 'predict' ? '🎯' : prompt?.kind === 'meal' ? '🍽️' : '🏆'

  return (
    <AnimatePresence>
      {prompt && message && (
        <motion.aside
          key={prompt.key}
          role="status"
          aria-live="polite"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className={`fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[60] px-3`}
        >
          <div
            className={`mx-auto max-w-lg overflow-hidden rounded-2xl border bg-card shadow-[0_8px_32px_rgb(0_0_0/0.25)] ${
              prompt.kind === 'meal'
                ? 'border-[#E23744]/35 shadow-[0_0_24px_rgb(226_55_68/0.15)]'
                : 'border-simelabs/35 shadow-[0_0_24px_rgb(38_203_153/0.15)]'
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              {prompt.kind === 'predict' ? (
                <div className="flex shrink-0 -space-x-2">
                  <TeamFlag team={prompt.match.home_team} emoji={prompt.match.home_flag} size="sm" />
                  <TeamFlag team={prompt.match.away_team} emoji={prompt.match.away_flag} size="sm" />
                </div>
              ) : (
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                    prompt.kind === 'meal' ? 'bg-[#E23744]/15' : 'bg-simelabs/15'
                  }`}
                >
                  {emoji}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug text-theme text-balance">
                    {message.title}
                  </p>
                  <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dismiss"
                    className="shrink-0 rounded-lg px-1.5 py-0.5 text-muted transition hover:bg-muted hover:text-theme"
                  >
                    ✕
                  </button>
                </div>
                <div className="type-caption mt-1 space-y-0.5 leading-relaxed text-muted">
                  {message.bodyLines.map((line) => (
                    <p key={line} className="text-pretty">
                      {line}
                    </p>
                  ))}
                </div>

                {prompt.kind === 'predict' && (
                  <div className="mt-2">
                    <LockCountdown kickoffAt={prompt.match.kickoff_at} variant="chip" />
                  </div>
                )}

                {prompt.kind === 'meal' && (
                  <div className="mt-2">
                    <LockCountdown kickoffAt={prompt.match.kickoff_at} variant="chip" />
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={goToAction}
                    className="rounded-xl bg-simelabs px-4 py-2 text-xs font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark"
                  >
                    {actionLabel}
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="rounded-xl px-3 py-2 text-xs font-medium text-muted transition hover:text-theme"
                  >
                    Later
                  </button>
                  {notificationsSupported && !notificationsEnabled && prompt.kind === 'predict' && (
                    <button
                      type="button"
                      onClick={() => void requestNotifications()}
                      className="rounded-xl px-3 py-2 text-xs font-medium text-simelabs transition hover:bg-simelabs/10"
                    >
                      Enable alerts
                    </button>
                  )}
                </div>
              </div>
            </div>

            {(prompt.kind === 'predict' && prompt.urgent) || prompt.kind === 'meal' ? (
              <motion.div
                className={`h-0.5 bg-gradient-to-r ${
                  prompt.kind === 'meal'
                    ? 'from-[#E23744] via-[#ff6b6b] to-[#E23744]'
                    : 'from-simelabs via-simelabs-light to-simelabs'
                }`}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ) : null}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
