import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { Match } from '../lib/types'
import { canPredictMatch } from '../lib/matchUtils'
import { ScoreStepper } from './ScoreStepper'
import { TeamLabel } from './TeamLabel'
import { playSound } from '../lib/sounds'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from '../contexts/MatchesContext'
import { useSeasonQuestionnaireContextOptional } from '../contexts/SeasonQuestionnaireContext'
import { LockCountdown } from './LockCountdown'

interface PredictionModalProps {
  match: Match | null
  allMatches?: Match[]
  initialHome?: number
  initialAway?: number
  onClose: () => void
  onSaved: (meta?: { firstPredictionBonus?: boolean }) => void
}

export function PredictionModal({
  match,
  allMatches = [],
  initialHome = 0,
  initialAway = 0,
  onClose,
  onSaved,
}: PredictionModalProps) {
  const { user } = useAuth()
  const { predictions } = useMatches()
  const season = useSeasonQuestionnaireContextOptional()
  const [home, setHome] = useState(initialHome)
  const [away, setAway] = useState(initialAway)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-sync when opening edit — useState only initialises on first mount
  useEffect(() => {
    if (match) {
      setHome(initialHome)
      setAway(initialAway)
      setError(null)
      setSaving(false)
    }
  }, [match, initialHome, initialAway])

  const handleSave = async () => {
    if (!match || !user) return
    if (season && !season.canPredictMatches) {
      setError('Complete your season picks (Golden Boot, winner, etc.) before match predictions.')
      season.openQuestionnaire()
      return
    }
    if (allMatches.length > 0 && !canPredictMatch(match, allMatches)) {
      setError('This match is not open for prediction (today & tomorrow IST only, until 15 min before kickoff).')
      return
    }
    playSound('save')
    setSaving(true)
    setError(null)

    const isFirstPrediction = Object.keys(predictions).length === 0

    const { error: saveError } = await supabase.from('predictions').upsert(
      {
        user_id: user.id,
        match_id: match.id,
        home_pred: home,
        away_pred: away,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,match_id' },
    )

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    onSaved(isFirstPrediction ? { firstPredictionBonus: true } : undefined)
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {match && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[100] mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-t-3xl border border-default bg-card shadow-2xl"
          >
            <div className="p-6 pb-8">
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" />

              <h2 className="type-section-title text-center">Your Prediction</h2>
              <div className="mt-3">
                <LockCountdown kickoffAt={match.kickoff_at} variant="banner" />
              </div>
              <div className="mt-4 flex items-start justify-center gap-2 sm:gap-4">
                <TeamLabel
                  team={match.home_team}
                  emoji={match.home_flag}
                  flagSize="lg"
                  nameClassName="!text-xs font-medium text-subtle"
                />
                <span className="type-caption shrink-0 self-center font-medium text-muted">vs</span>
                <TeamLabel
                  team={match.away_team}
                  emoji={match.away_flag}
                  flagSize="lg"
                  nameClassName="!text-xs font-medium text-subtle"
                />
              </div>

              <div className="mt-8 flex items-center justify-center gap-8">
                <ScoreStepper value={home} onChange={setHome} label={match.home_team} />
                <span className="type-score font-light text-muted">–</span>
                <ScoreStepper value={away} onChange={setAway} label={match.away_team} />
              </div>

              {season && !season.canPredictMatches && (
                <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200">
                  Complete season picks first (Golden Boot, winner, etc.)
                </p>
              )}

              {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

              <div className="mt-8 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-default py-3 text-sm font-semibold text-subtle transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-simelabs py-3 text-sm font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Prediction'}
                </button>
              </div>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function triggerExactScoreConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#26cb99', '#009688', '#4dd9ac'],
  })
}
