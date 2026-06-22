import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SHOOTOUT_ZONES, type ShootoutZone } from '../../lib/shootout/types'
import { ZONE_LABELS, ZONE_POSITION } from '../../lib/shootout/zones'

interface ShootoutGoalProps {
  mode: 'dive' | 'shoot'
  disabled?: boolean
  keeperHintZone?: ShootoutZone | null
  onPick: (zone: ShootoutZone) => void
}

export function ShootoutGoal({ mode, disabled, keeperHintZone, onPick }: ShootoutGoalProps) {
  const [keeperPos, setKeeperPos] = useState(0.5)

  useEffect(() => {
    if (mode !== 'shoot') return undefined
    let frame = 0
    const id = window.setInterval(() => {
      frame += 1
      const t = frame / 30
      setKeeperPos(0.5 + Math.sin(t * 2.2) * 0.38)
    }, 50)
    return () => window.clearInterval(id)
  }, [mode])

  const keeperLeft = mode === 'shoot' ? `${keeperPos * 100}%` : keeperHintZone ? `${ZONE_POSITION[keeperHintZone] * 100}%` : '50%'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 px-3 pb-4 pt-6 shadow-inner">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      <p className="relative text-center text-[10px] font-bold uppercase tracking-widest text-emerald-200/70">
        {mode === 'dive' ? 'Pick your dive' : 'Beat the keeper'}
      </p>

      <div className="relative mx-auto mt-4 aspect-[16/10] max-w-sm">
        <div className="absolute inset-x-4 bottom-0 top-8 rounded-t-lg border-4 border-white/80 bg-emerald-800/40">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 12px), repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 12px)',
          }} />
        </div>

        <motion.div
          className="absolute bottom-10 z-10 flex -translate-x-1/2 flex-col items-center"
          style={{ left: keeperLeft }}
          animate={{ scale: mode === 'dive' ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: mode === 'dive' ? Infinity : 0, duration: 1.2 }}
        >
          <span className="text-2xl">🧤</span>
          <span className="rounded bg-black/50 px-1.5 text-[9px] font-bold text-white">KEEPER</span>
        </motion.div>

        <div className="absolute bottom-2 left-4 right-4 grid grid-cols-5 gap-1">
          {SHOOTOUT_ZONES.map((zone) => (
            <button
              key={zone}
              type="button"
              disabled={disabled}
              onClick={() => onPick(zone)}
              className="rounded-lg border border-white/20 bg-black/30 py-3 text-[9px] font-bold uppercase text-white/90 transition hover:border-amber-400 hover:bg-amber-500/20 disabled:opacity-40"
            >
              {ZONE_LABELS[zone].split(' ').pop()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
