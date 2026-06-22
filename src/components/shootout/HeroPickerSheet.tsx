import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { listHeroOptions } from '../../lib/shootout/hero'
import type { ArenaHero } from '../../lib/shootout/types'
import { ROLE_COLORS } from '../../lib/formations'
import { SupportingTeamFlag } from '../SupportingTeamFlag'

interface HeroPickerSheetProps {
  open: boolean
  heartTeam: string | null
  currentHero: ArenaHero | null
  onClose: () => void
  onSave: (hero: ArenaHero) => Promise<void>
}

export function HeroPickerSheet({
  open,
  heartTeam,
  currentHero,
  onClose,
  onSave,
}: HeroPickerSheetProps) {
  const [selected, setSelected] = useState<ArenaHero | null>(currentHero)
  const [busy, setBusy] = useState(false)

  const options = useMemo(
    () => (heartTeam ? listHeroOptions(heartTeam) : []),
    [heartTeam],
  )

  const save = async () => {
    if (!selected) return
    setBusy(true)
    await onSave(selected)
    setBusy(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-x-0 bottom-0 z-[201] mx-auto max-h-[85dvh] max-w-lg overflow-y-auto rounded-t-3xl border border-default bg-card p-5"
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-muted" />
            <h3 className="type-section-title">Choose your hero</h3>
            <p className="type-caption mt-1 text-muted">
              Pick a player from your heart team for the Arena.
            </p>

            {heartTeam ? (
              <div className="mt-3">
                <SupportingTeamFlag team={heartTeam} variant="inline" />
              </div>
            ) : (
              <p className="mt-3 text-sm text-amber-400">
                Set your heart team in season picks first.
              </p>
            )}

            <ul className="mt-4 space-y-2">
              {options.map((hero) => {
                const active =
                  selected?.name === hero.name && selected?.number === hero.number
                return (
                  <li key={`${hero.number}-${hero.name}`}>
                    <button
                      type="button"
                      onClick={() => setSelected(hero)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? 'border-simelabs bg-simelabs/10'
                          : 'border-default bg-muted/20 hover:border-simelabs/30'
                      }`}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: ROLE_COLORS[hero.role] }}
                      >
                        {hero.number}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-theme">{hero.name}</p>
                        <p className="text-xs text-muted">{hero.role}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>

            <button
              type="button"
              disabled={!selected || busy}
              onClick={() => void save()}
              className="mt-5 w-full rounded-xl bg-simelabs py-3 text-sm font-semibold text-simelabs-foreground disabled:opacity-50"
            >
              Save hero
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
