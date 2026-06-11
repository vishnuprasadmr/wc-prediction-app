import { motion } from 'framer-motion'
import { useLockCountdown } from '../hooks/useLockCountdown'
import { formatPredictionLockTimeIst } from '../lib/matchUtils'

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

interface LockCountdownProps {
  kickoffAt: string
  variant?: 'chip' | 'banner' | 'hero'
  className?: string
  saved?: boolean
}

export function LockCountdown({
  kickoffAt,
  variant = 'chip',
  className = '',
  saved = false,
}: LockCountdownProps) {
  const live = variant === 'hero'
  const { label, urgent, locked } = useLockCountdown(kickoffAt, { live })

  if (locked || !label) return null

  const lockTime = formatPredictionLockTimeIst(kickoffAt)

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`overflow-hidden rounded-2xl border shadow-card ${
          urgent
            ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-card to-card'
            : 'border-simelabs/35 bg-gradient-to-br from-simelabs/10 via-card to-card'
        } ${className}`}
      >
        <div className="px-4 py-4 text-center">
          <div
            className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${
              urgent ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-simelabs/15 text-simelabs'
            }`}
          >
            <LockIcon className="h-5 w-5" />
          </div>
          <p
            className={`type-overline ${urgent ? 'text-amber-600 dark:text-amber-400' : 'text-simelabs'}`}
          >
            {urgent ? 'Locking soon' : 'Predictions lock in'}
          </p>
          <p
            className={`mt-2 font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-5xl ${
              urgent ? 'text-amber-600 dark:text-amber-300' : 'text-simelabs'
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {label}
          </p>
          <p className="type-caption mt-2 text-muted">
            {saved ? 'You can still edit until' : 'Closes at'}{' '}
            <span className="font-medium text-subtle">{lockTime} IST</span>
            <span className="text-muted/50"> · </span>
            15 min before kickoff
          </p>
        </div>
        {urgent && (
          <motion.div
            className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </motion.div>
    )
  }

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border px-3 py-2.5 ${
          urgent
            ? 'border-amber-500/50 bg-amber-500/10'
            : 'border-simelabs/30 bg-simelabs/5'
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                urgent ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-simelabs/15 text-simelabs'
              }`}
            >
              <LockIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
            <p
              className={`text-xs font-semibold ${urgent ? 'text-amber-600 dark:text-amber-400' : 'text-simelabs'}`}
            >
              {urgent ? 'Locking soon — predict now!' : 'Time left to predict'}
            </p>
            <p className="type-caption mt-0.5 text-muted">Locks at {lockTime} IST</p>
            </div>
          </div>
          <span
            className={`shrink-0 font-mono text-lg font-bold tabular-nums ${
              urgent ? 'text-amber-600 dark:text-amber-400' : 'text-simelabs'
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {label}
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-semibold tabular-nums ${
        urgent
          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
          : 'bg-simelabs/10 text-simelabs'
      } ${className}`}
      aria-live="polite"
    >
      <LockIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
      <span className="font-sans font-medium opacity-80">Lock in</span>
      {label}
    </span>
  )
}
