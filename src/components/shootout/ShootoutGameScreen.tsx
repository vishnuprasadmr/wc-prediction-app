import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import type { ShootoutChallengeView } from '../../hooks/useShootoutChallenges'
import {
  submitShootoutDive,
  submitShootoutShot,
} from '../../hooks/useShootoutChallenges'
import type { ShootoutZone } from '../../lib/shootout/types'
import { randomBanter } from '../../lib/shootout/banter'
import { playSound, primeAudio } from '../../lib/sounds'
import { fireCelebration } from '../../lib/confetti'
import { ShootoutGoal } from './ShootoutGoal'
import { KickResultOverlay, ShootoutScoreboard } from './ShootoutScoreboard'
import { ShootoutVictoryScreen } from './ShootoutVictoryScreen'

interface ShootoutGameScreenProps {
  challenge: ShootoutChallengeView
  open: boolean
  onClose: () => void
  onComplete: () => void
}

export function ShootoutGameScreen({
  challenge,
  open,
  onClose,
  onComplete,
}: ShootoutGameScreenProps) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [overlay, setOverlay] = useState<{
    outcome: 'goal' | 'save'
    line: string
    actorName: string
    actorAvatar?: string | null
  } | null>(null)
  const [showVictory, setShowVictory] = useState(false)

  useEffect(() => {
    if (open && challenge.status === 'completed' && challenge.winner_id) {
      setShowVictory(true)
    }
  }, [open, challenge.status, challenge.winner_id])

  if (!user || !open) return null

  const myTurn = challenge.turn_user_id === user.id
  const isKeeperTurn = challenge.phase === 'keeper_dive' && myTurn
  const isShooterTurn = challenge.phase === 'shooter_shoot' && myTurn

  const leftName = challenge.challenger_name
  const rightName = challenge.opponent_name
  const leftScore = challenge.challenger_score
  const rightScore = challenge.opponent_score
  const leftAvatar = challenge.challenger_avatar
  const rightAvatar = challenge.opponent_avatar
  const leftHero = challenge.challenger_hero
  const rightHero = challenge.opponent_hero

  const kickerName =
    challenge.active_kicker_id === challenge.challenger_id
      ? challenge.challenger_name
      : challenge.opponent_name
  const keeperName =
    challenge.active_keeper_id === challenge.challenger_id
      ? challenge.challenger_name
      : challenge.opponent_name

  const handleDive = async (zone: ShootoutZone) => {
    if (busy || !isKeeperTurn) return
    setBusy(true)
    primeAudio()
    const result = await submitShootoutDive(challenge.id, zone)
    setBusy(false)
    if (!result.ok) {
      window.alert(result.message)
      return
    }
    playSound('select')
    onComplete()
  }

  const handleShot = async (zone: ShootoutZone) => {
    if (busy || !isShooterTurn) return
    setBusy(true)
    primeAudio()
    const banter = randomBanter('goal', false)
    const result = await submitShootoutShot(challenge.id, zone, banter)
    setBusy(false)
    if (!result.ok) {
      window.alert(result.message)
      return
    }
    const outcome = (result.outcome as 'goal' | 'save') ?? 'goal'
    if (outcome === 'goal') {
      playSound('goalUp')
    } else {
      playSound('goalDown')
    }
    setOverlay({
      outcome,
      line: randomBanter(outcome, outcome === 'save'),
      actorName: outcome === 'goal' ? kickerName : keeperName,
      actorAvatar: outcome === 'goal'
        ? challenge.active_kicker_id === challenge.challenger_id
          ? challenge.challenger_avatar
          : challenge.opponent_avatar
        : challenge.active_keeper_id === challenge.challenger_id
          ? challenge.challenger_avatar
          : challenge.opponent_avatar,
    })
    if (result.completed) {
      fireCelebration('podium')
    }
    onComplete()
  }

  const closeOverlay = () => {
    setOverlay(null)
  }

  return (
    <>
      <AnimatePresence>
        {open && !showVictory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex flex-col bg-gradient-to-b from-emerald-950 via-black to-black"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Arena</p>
                <h2 className="text-lg font-bold text-white">Penalty shootout</h2>
              </div>
              <button type="button" onClick={onClose} className="text-white/60 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <ShootoutScoreboard
                leftName={leftName}
                rightName={rightName}
                leftScore={leftScore}
                rightScore={rightScore}
                leftAvatar={leftAvatar}
                rightAvatar={rightAvatar}
                leftHero={leftHero}
                rightHero={rightHero}
                kickLabel={`Kick ${challenge.kick_number}${challenge.kick_number > 10 ? ' · Sudden death' : ''}`}
              />

              {!myTurn && challenge.status === 'active' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                  <p className="text-sm font-semibold text-amber-200">Waiting for your rival…</p>
                  <p className="mt-1 text-xs text-amber-200/70">
                    {challenge.phase === 'keeper_dive'
                      ? `${keeperName} is choosing a dive`
                      : `${kickerName} is taking their shot`}
                  </p>
                </div>
              )}

              {isKeeperTurn && (
                <>
                  <p className="text-center text-sm font-medium text-white/80">
                    You&apos;re in goal — where do you dive?
                  </p>
                  <ShootoutGoal mode="dive" disabled={busy} onPick={(z) => void handleDive(z)} />
                </>
              )}

              {isShooterTurn && (
                <>
                  <p className="text-center text-sm font-medium text-white/80">
                    {(user.id === challenge.challenger_id ? leftHero : rightHero)
                      ? `Go on, ${(user.id === challenge.challenger_id ? leftHero : rightHero)?.name.split(' ').pop()}!`
                      : 'Pick your spot — read the moving keeper'}
                  </p>
                  <ShootoutGoal mode="shoot" disabled={busy} onPick={(z) => void handleShot(z)} />
                </>
              )}

              {challenge.taunt_text && (
                <p className="text-center text-xs italic text-white/50">“{challenge.taunt_text}”</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <KickResultOverlay
        open={Boolean(overlay)}
        outcome={overlay?.outcome ?? null}
        line={overlay?.line ?? ''}
        actorName={overlay?.actorName ?? ''}
        actorAvatar={overlay?.actorAvatar}
        onDone={closeOverlay}
      />

      {showVictory && challenge.status === 'completed' && (
        <ShootoutVictoryScreen
          challenge={challenge}
          userId={user.id}
          onClose={() => {
            setShowVictory(false)
            onClose()
          }}
        />
      )}
    </>
  )
}
