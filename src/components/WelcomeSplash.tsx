import { useCallback, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { markSplashSeen } from '../lib/splash'

interface WelcomeSplashProps {
  onComplete: () => void
}

type Phase = 'idle' | 'kick' | 'shatter'

interface Point {
  x: number
  y: number
}

const features = [
  { icon: '⚽', label: 'Predict matches' },
  { icon: '🏆', label: 'Climb the table' },
  { icon: '⚡', label: 'Early bird bonus' },
]

const SHARDS = [
  { clip: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)', x: -140, y: -120, rotate: -12 },
  { clip: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)', x: 140, y: -120, rotate: 12 },
  { clip: 'polygon(0 50%, 50% 50%, 50% 100%, 0 100%)', x: -140, y: 120, rotate: 10 },
  { clip: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)', x: 140, y: 120, rotate: -10 },
] as const

function getRelativePoint(e: React.MouseEvent, root: HTMLElement): Point {
  const rect = root.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  }
}

function ThemedBall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="ball-body" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#4dd9b0" />
          <stop offset="45%" stopColor="#26cb99" />
          <stop offset="100%" stopColor="#009688" />
        </radialGradient>
        <radialGradient id="ball-shine" cx="30%" cy="25%" r="40%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id="ball-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#ball-body)" filter="url(#ball-glow)" />
      <circle cx="32" cy="32" r="28" fill="url(#ball-shine)" />
      {/* Stylised panel lines — brand white on green */}
      <path
        d="M32 8 L42 18 L38 32 L32 28 L26 32 L22 18 Z"
        fill="white"
        fillOpacity="0.92"
      />
      <path d="M32 56 L22 46 L26 32 L32 36 L38 32 L42 46 Z" fill="white" fillOpacity="0.75" />
      <path d="M8 32 L18 22 L26 32 L22 38 L18 42 L8 32 Z" fill="white" fillOpacity="0.6" />
      <path d="M56 32 L46 22 L38 32 L42 38 L46 42 L56 32 Z" fill="white" fillOpacity="0.6" />
      <path d="M14 14 L22 18 L18 28 L12 22 Z" fill="white" fillOpacity="0.45" />
      <path d="M50 14 L42 18 L46 28 L52 22 Z" fill="white" fillOpacity="0.45" />
      <path d="M14 50 L22 46 L18 36 L12 42 Z" fill="white" fillOpacity="0.45" />
      <path d="M50 50 L42 46 L46 36 L52 42 Z" fill="white" fillOpacity="0.45" />
      <circle cx="32" cy="32" r="28" stroke="rgb(0 150 136 / 0.5)" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

export function WelcomeSplash({ onComplete }: WelcomeSplashProps) {
  const reduceMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [kickFrom, setKickFrom] = useState<Point>({ x: 50, y: 88 })
  const [impact, setImpact] = useState<Point>({ x: 50, y: 28 })

  const finish = useCallback(
    (e: React.MouseEvent) => {
      if (phase !== 'idle' || !rootRef.current) return

      const origin = getRelativePoint(e, rootRef.current)
      setKickFrom(origin)
      setImpact({
        x: 48 + (origin.x - 50) * 0.15,
        y: 22 + Math.min(8, (88 - origin.y) * 0.08),
      })
      markSplashSeen()

      if (reduceMotion) {
        onComplete()
        return
      }

      setPhase('kick')
      window.setTimeout(() => setPhase('shatter'), 580)
      window.setTimeout(() => onComplete(), 1100)
    },
    [phase, onComplete, reduceMotion],
  )

  const progressAnimate =
    phase === 'kick' || phase === 'shatter'
      ? { scaleX: 1, opacity: 0 }
      : { scaleX: 1, opacity: 1 }

  const progressTransition =
    phase === 'kick' || phase === 'shatter'
      ? { duration: 0.2, ease: 'easeOut' as const }
      : { duration: 4, ease: 'easeInOut' as const, delay: 0.2 }

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] overflow-hidden bg-page text-theme safe-top safe-bottom"
      onClick={finish}
      aria-label="Welcome screen. Tap anywhere to continue."
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-simelabs/20 blur-3xl"
          animate={phase === 'idle' ? { scale: [1, 1.15, 1], opacity: [0.5, 0.75, 0.5] } : { opacity: 0 }}
          transition={
            phase === 'idle'
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.25 }
          }
        />
        <motion.div
          className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-simelabs-dark/25 blur-3xl"
          animate={phase === 'idle' ? { scale: [1.1, 0.95, 1.1], opacity: [0.4, 0.65, 0.4] } : { opacity: 0 }}
          transition={
            phase === 'idle'
              ? { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }
              : { duration: 0.25 }
          }
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

      {/* Main content — fades on kick */}
      <motion.div
        className="pointer-events-none relative z-10 flex h-full flex-col"
        animate={{
          opacity: phase === 'shatter' ? 0 : phase === 'kick' ? 0.35 : 1,
          scale: phase === 'shatter' ? 0.96 : 1,
        }}
        transition={{ duration: phase === 'kick' ? 0.35 : 0.2 }}
      >
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-10">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
            className="relative mb-8"
          >
            {phase === 'idle' && (
              <>
                <motion.div
                  className="absolute inset-0 -m-4 rounded-3xl border border-simelabs/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-0 -m-2 rounded-2xl border border-dashed border-simelabs/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                />
              </>
            )}
            <motion.div
              className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-simelabs via-simelabs-light to-simelabs-dark font-heading text-3xl font-extrabold text-simelabs-foreground shadow-glow"
              animate={
                phase === 'idle'
                  ? {
                      boxShadow: [
                        '0 0 28px rgb(38 203 153 / 0.25)',
                        '0 0 48px rgb(38 203 153 / 0.45)',
                        '0 0 28px rgb(38 203 153 / 0.25)',
                      ],
                    }
                  : undefined
              }
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              WC
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="type-overline"
          >
            Simelabs
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.55 }}
            className="type-display mt-3 text-center"
          >
            WC 2026
            <span className="mt-1 block text-xl font-bold text-simelabs sm:text-2xl">
              Prediction League
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            className="type-body-sm mt-4 max-w-[18rem] text-center text-muted sm:max-w-xs"
          >
            Pick scores. Beat your colleagues.
            <span className="block sm:inline">
              <span className="hidden sm:inline"> </span>
              All kickoffs in IST.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 flex flex-wrap justify-center gap-2"
          >
            {features.map((item, i) => (
              <motion.span
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + i * 0.1 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-default bg-card/80 px-3 py-1.5 text-xs font-medium backdrop-blur-sm"
              >
                <span>{item.icon}</span>
                {item.label}
              </motion.span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="w-full px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          {!reduceMotion && (
            <div className="mb-4 h-0.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full origin-left rounded-full bg-gradient-to-r from-simelabs-dark via-simelabs to-simelabs-light"
                initial={{ scaleX: 0 }}
                animate={progressAnimate}
                transition={progressTransition}
              />
            </div>
          )}

          <motion.button
            type="button"
            className="pointer-events-auto w-full rounded-2xl bg-gradient-to-r from-simelabs-dark via-simelabs to-simelabs-light py-4 font-heading text-base font-bold text-simelabs-foreground shadow-glow"
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation()
              finish(e)
            }}
          >
            Get started
          </motion.button>

          <p className="type-caption mt-3 text-center">
            Tap anywhere to kick off
            <span className="text-muted/50"> · </span>
            <span className="whitespace-nowrap">Simelabs WC 2026</span>
          </p>
        </motion.div>
      </motion.div>

      {/* Themed football kick + glow trail */}
      {(phase === 'kick' || phase === 'shatter') && (
        <motion.div
          className="pointer-events-none absolute z-[220]"
          style={{
            left: `${kickFrom.x}%`,
            top: `${kickFrom.y}%`,
            marginLeft: '-1.75rem',
            marginTop: '-1.75rem',
          }}
          initial={{ rotate: 0, scale: 0.3, opacity: 0 }}
          animate={{
            left: `${impact.x}%`,
            top: `${impact.y}%`,
            rotate: [0, 220, 480],
            scale: [0.3, 1, 0.85],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 0.58,
            ease: [0.18, 0.85, 0.32, 1],
            left: { duration: 0.58, ease: [0.12, 0.92, 0.28, 1] },
            top: { duration: 0.58, ease: [0.12, 0.92, 0.28, 1] },
            opacity: { times: [0, 0.12, 0.88, 1], duration: 0.58 },
          }}
        >
          {/* Motion streak */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-3 w-16 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-simelabs/70 to-simelabs-light/90 blur-sm"
            style={{ transformOrigin: 'right center', marginLeft: '-4rem' }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1.4, 0.6], opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute -inset-3 rounded-full bg-simelabs/30 blur-xl"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.6, 1], opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.55 }}
          />
          <ThemedBall className="relative h-14 w-14 drop-shadow-[0_0_12px_rgb(38_203_153/0.65)]" />
        </motion.div>
      )}

      {/* Impact ripple + crack lines */}
      {(phase === 'kick' || phase === 'shatter') && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[215]"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'shatter' ? 1 : 0 }}
          transition={{ delay: phase === 'kick' ? 0.48 : 0, duration: 0.12 }}
        >
          <motion.div
            className="absolute rounded-full border-2 border-simelabs/60 bg-simelabs/10"
            style={{
              left: `${impact.x}%`,
              top: `${impact.y}%`,
              width: '2rem',
              height: '2rem',
              marginLeft: '-1rem',
              marginTop: '-1rem',
            }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 4.5, 6], opacity: [0, 0.7, 0] }}
            transition={{ duration: 0.55, delay: 0.5, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute rounded-full border border-simelabs-light/40"
            style={{
              left: `${impact.x}%`,
              top: `${impact.y}%`,
              width: '1.5rem',
              height: '1.5rem',
              marginLeft: '-0.75rem',
              marginTop: '-0.75rem',
            }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 3, 4.5], opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.45, delay: 0.54, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 bg-simelabs/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.45, 0] }}
            transition={{ duration: 0.35, delay: 0.5 }}
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="crack-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#009688" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#26cb99" stopOpacity="1" />
                <stop offset="100%" stopColor="#4dd9b0" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {[
              `M ${impact.x} ${impact.y} L 0 0`,
              `M ${impact.x} ${impact.y} L 100 0`,
              `M ${impact.x} ${impact.y} L 100 100`,
              `M ${impact.x} ${impact.y} L 0 100`,
              `M ${impact.x} ${impact.y} L 50 0`,
              `M ${impact.x} ${impact.y} L 100 50`,
              `M ${impact.x} ${impact.y} L 50 100`,
              `M ${impact.x} ${impact.y} L 0 50`,
            ].map((d, i) => (
              <motion.path
                key={d}
                d={d}
                stroke="url(#crack-grad)"
                strokeWidth={0.4}
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 0.7] }}
                transition={{ duration: 0.3, delay: 0.52 + i * 0.018, ease: 'easeOut' }}
              />
            ))}
          </svg>
        </motion.div>
      )}

      {/* Shattering panels */}
      {phase === 'shatter' &&
        SHARDS.map((shard, i) => (
          <motion.div
            key={shard.clip}
            className="pointer-events-none absolute inset-0 z-[210] border border-simelabs/25 bg-page shadow-[0_0_24px_rgb(38_203_153/0.12)]"
            style={{ clipPath: shard.clip }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{
              x: shard.x,
              y: shard.y,
              rotate: shard.rotate,
              opacity: 0,
            }}
            transition={{ duration: 0.52, delay: i * 0.03, ease: [0.32, 0.72, 0, 1] }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, rgb(38 203 153 / 0.12) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </motion.div>
        ))}
    </div>
  )
}
