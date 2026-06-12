import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Badge } from '../lib/badges'
import { playSound, primeAudio } from '../lib/sounds'

interface BadgeUnlockModalProps {
  badge: Badge | null
  onDismiss: () => void
}

export function BadgeUnlockModal({ badge, onDismiss }: BadgeUnlockModalProps) {
  useEffect(() => {
    if (!badge) return
    primeAudio()
    playSound('save')
  }, [badge])

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[280] flex items-end justify-center bg-black/50 p-4 pb-28 backdrop-blur-sm sm:items-center sm:pb-4"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ y: 80, rotateY: 90 }}
            animate={{ y: 0, rotateY: 0 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="w-full max-w-sm rounded-2xl border border-simelabs/35 bg-card p-6 text-center shadow-glow"
            onClick={(e) => e.stopPropagation()}
            style={{ transformPerspective: 800 }}
          >
            <p className="type-overline !text-simelabs">Badge unlocked</p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
              className="mx-auto mt-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-simelabs/15 text-4xl ring-2 ring-simelabs/40"
            >
              {badge.icon}
            </motion.div>
            <h3 className="type-section-title mt-4">{badge.label}</h3>
            <p className="type-caption mt-2 text-muted">New achievement earned!</p>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-5 w-full rounded-xl bg-simelabs py-2.5 text-sm font-semibold text-simelabs-foreground"
            >
              Collect
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
