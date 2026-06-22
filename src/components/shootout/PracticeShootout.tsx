import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SHOOTOUT_ZONES, type ShootoutZone } from '../../lib/shootout/types'
import { resolveKickOutcome } from '../../lib/shootout/resolveKick'
import { randomBanter } from '../../lib/shootout/banter'
import { playSound, primeAudio } from '../../lib/sounds'
import { ShootoutGoal } from './ShootoutGoal'
import { KickResultOverlay } from './ShootoutScoreboard'

interface PracticeShootoutProps {
  open: boolean
  heroName?: string
  onClose: () => void
}

export function PracticeShootout({ open, heroName, onClose }: PracticeShootoutProps) {
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [keeperZone, setKeeperZone] = useState<ShootoutZone | null>(null)
  const [overlay, setOverlay] = useState<{ outcome: 'goal' | 'save'; line: string } | null>(null)
  const maxAttempts = 5

  const shoot = useCallback((zone: ShootoutZone) => {
    if (attempts >= maxAttempts || overlay) return
    primeAudio()
    const keeper = SHOOTOUT_ZONES[Math.floor(Math.random() * SHOOTOUT_ZONES.length)]
    setKeeperZone(keeper)
    const outcome = resolveKickOutcome(zone, keeper)
    setAttempts((a) => a + 1)
    if (outcome === 'goal') {
      playSound('goalUp')
      setScore((s) => s + 1)
    } else {
      playSound('goalDown')
    }
    setOverlay({ outcome, line: randomBanter(outcome, outcome === 'save') })
    window.setTimeout(() => setKeeperZone(null), 400)
  }, [attempts, overlay])

  const reset = () => {
    setScore(0)
    setAttempts(0)
    setKeeperZone(null)
    setOverlay(null)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[240] flex flex-col bg-gradient-to-b from-emerald-950 via-black to-black"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-400">Practice</p>
              <h2 className="text-lg font-bold text-white">
                {heroName ? `${heroName.split(' ').pop()} training` : 'Solo shootout'}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="text-white/60">✕</button>
          </div>

          <div className="flex-1 p-4 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-3xl font-black tabular-nums text-simelabs">{score} / {attempts}</p>
              <p className="text-xs text-white/60">{maxAttempts - attempts} kicks left · no points</p>
            </div>

            <ShootoutGoal
              mode="shoot"
              disabled={attempts >= maxAttempts || Boolean(overlay)}
              keeperHintZone={keeperZone}
              onPick={shoot}
            />

            <div className="flex gap-2">
              <button type="button" onClick={reset} className="flex-1 rounded-xl border border-white/20 py-2 text-sm text-white">
                Reset
              </button>
              <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-simelabs py-2 text-sm font-semibold text-simelabs-foreground">
                Done
              </button>
            </div>
          </div>

          <KickResultOverlay
            open={Boolean(overlay)}
            outcome={overlay?.outcome ?? null}
            line={overlay?.line ?? ''}
            actorName={heroName ?? 'You'}
            onDone={() => setOverlay(null)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
