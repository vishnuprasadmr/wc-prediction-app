import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { playSound, primeAudio } from '../lib/sounds'
import type { Match } from '../lib/types'
import { TeamFlag } from './TeamFlag'

interface PenaltyShootoutProps {
  match: Match
  open: boolean
  onClose: () => void
}

type Zone = 'left' | 'center' | 'right'

const ZONES: Zone[] = ['left', 'center', 'right']
const KEEPER_CHANCE = 0.35

export function PenaltyShootout({ match, open, onClose }: PenaltyShootoutProps) {
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [keeperZone, setKeeperZone] = useState<Zone | null>(null)
  const maxAttempts = 5

  const shoot = useCallback((zone: Zone) => {
    if (attempts >= maxAttempts) return
    primeAudio()

    const keeper = ZONES[Math.floor(Math.random() * ZONES.length)]
    setKeeperZone(keeper)
    const saved = keeper === zone && Math.random() < KEEPER_CHANCE + 0.25

    setAttempts((a) => a + 1)
    if (saved) {
      playSound('goalDown')
      setMessage('Saved! 🧤')
    } else {
      playSound('goalUp')
      setScore((s) => s + 1)
      setMessage('GOAL! ⚽')
    }

    window.setTimeout(() => {
      setMessage(null)
      setKeeperZone(null)
    }, 900)
  }, [attempts])

  const reset = () => {
    setScore(0)
    setAttempts(0)
    setMessage(null)
    setKeeperZone(null)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 30, opacity: 0 }}
            className="w-full max-w-md rounded-2xl bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="type-overline !text-[10px]">Mini game</p>
                <h3 className="type-section-title">Penalty shootout</h3>
              </div>
              <button type="button" onClick={onClose} className="text-muted hover:text-theme">
                ✕
              </button>
            </div>

            <p className="type-caption mt-1 text-muted">
              {match.home_team} vs {match.away_team} · just for fun, no points
            </p>

            <div className="relative mt-4 overflow-hidden rounded-xl border border-simelabs/30 bg-gradient-to-b from-simelabs/20 to-simelabs/5 px-4 py-6">
              <div className="flex items-center justify-center gap-2">
                <TeamFlag team={match.home_team} emoji={match.home_flag} size="sm" />
                <p className="font-heading text-lg font-bold tabular-nums">
                  {score} / {attempts}
                </p>
                <span className="text-xs text-muted">· {maxAttempts - attempts} left</span>
              </div>

              {message && (
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-3 text-center text-sm font-bold text-simelabs"
                >
                  {message}
                </motion.p>
              )}

              <div className="mt-4 grid grid-cols-3 gap-2">
                {ZONES.map((z) => (
                  <button
                    key={z}
                    type="button"
                    disabled={attempts >= maxAttempts}
                    onClick={() => shoot(z)}
                    className={`rounded-xl border py-4 text-xs font-semibold capitalize transition disabled:opacity-40 ${
                      keeperZone === z
                        ? 'border-amber-500/50 bg-amber-500/15 text-amber-600'
                        : 'border-default bg-card/80 hover:border-simelabs/40'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-xl border border-default py-2 text-sm font-medium"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-simelabs py-2 text-sm font-semibold text-simelabs-foreground"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
