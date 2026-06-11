import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { markSplashSeen } from '../lib/splash'

interface WelcomeSplashProps {
  onComplete: () => void
}

const features = [
  { icon: '⚽', label: 'Predict matches' },
  { icon: '🏆', label: 'Climb the table' },
  { icon: '⚡', label: 'Early bird bonus' },
]

export function WelcomeSplash({ onComplete }: WelcomeSplashProps) {
  const reduceMotion = useReducedMotion()
  const [exiting, setExiting] = useState(false)

  const finish = useCallback(() => {
    if (exiting) return
    setExiting(true)
    markSplashSeen()
    window.setTimeout(() => {
      onComplete()
    }, reduceMotion ? 0 : 480)
  }, [exiting, onComplete, reduceMotion])

  useEffect(() => {
    if (reduceMotion) return
    const timer = window.setTimeout(finish, 4200)
    return () => window.clearTimeout(timer)
  }, [finish, reduceMotion])

  const duration = reduceMotion ? 0 : undefined

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-page text-theme safe-top safe-bottom"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1, y: exiting ? -24 : 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: 'easeInOut' }}
    >
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-simelabs/20 blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-simelabs-dark/25 blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1.1, 0.95, 1.1], opacity: [0.4, 0.65, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-simelabs-light/10 blur-2xl"
          animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 opacity-[0.35] dark:opacity-20">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: 'radial-gradient(circle, rgb(38 203 153 / 0.14) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              maskImage: 'linear-gradient(to bottom, black 30%, transparent 85%)',
            }}
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-10">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: duration === 0 ? 0 : 0.1 }}
          className="relative mb-8"
        >
          {!reduceMotion && (
            <motion.div
              className="absolute inset-0 -m-4 rounded-3xl border border-simelabs/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {!reduceMotion && (
            <motion.div
              className="absolute inset-0 -m-2 rounded-2xl border border-dashed border-simelabs/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <motion.div
            className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-simelabs via-simelabs-light to-simelabs-dark text-3xl font-extrabold text-simelabs-foreground shadow-glow"
            animate={reduceMotion ? undefined : { boxShadow: ['0 0 28px rgb(38 203 153 / 0.25)', '0 0 48px rgb(38 203 153 / 0.45)', '0 0 28px rgb(38 203 153 / 0.25)'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            WC
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: duration === 0 ? 0 : 0.35, duration: 0.5 }}
          className="text-sm font-semibold uppercase tracking-[0.35em] text-simelabs"
        >
          Simelabs
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: duration === 0 ? 0 : 0.5, duration: 0.55 }}
          className="mt-2 text-center text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          WC 2026
          <span className="block text-xl font-bold text-simelabs sm:text-2xl">Prediction League</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: duration === 0 ? 0 : 0.75, duration: 0.5 }}
          className="mt-3 max-w-xs text-center text-sm text-muted"
        >
          Pick scores. Beat your colleagues. All kickoffs in IST.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: duration === 0 ? 0 : 1, duration: 0.5 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {features.map((item, i) => (
            <motion.span
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: duration === 0 ? 0 : 1.1 + i * 0.1 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-default bg-card/80 px-3 py-1.5 text-xs font-medium backdrop-blur-sm"
            >
              <span>{item.icon}</span>
              {item.label}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: duration === 0 ? 0 : 1.4, duration: 0.5 }}
        className="relative z-10 w-full px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        {!reduceMotion && (
          <div className="mb-4 h-0.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full origin-left rounded-full bg-gradient-to-r from-simelabs-dark via-simelabs to-simelabs-light"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 4, ease: 'easeInOut', delay: 0.2 }}
            />
          </div>
        )}

        <motion.button
          type="button"
          onClick={finish}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-2xl bg-gradient-to-r from-simelabs-dark via-simelabs to-simelabs-light py-4 text-base font-bold text-simelabs-foreground shadow-glow transition hover:opacity-95"
        >
          Get started
        </motion.button>

        <p className="mt-3 text-center text-[11px] text-muted">Simelabs internal league · FIFA World Cup 2026</p>
      </motion.div>
    </motion.div>
  )
}
