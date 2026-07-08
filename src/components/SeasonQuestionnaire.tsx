import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  GOLDEN_BOOT_CANDIDATES,
  MAX_SEASON_BONUS,
  SEASON_QUESTIONS,
  WC_TEAMS,
  type SeasonAnswers,
  type SeasonQuestion,
} from '../lib/seasonQuestions'
import { playSound } from '../lib/sounds'
import { TeamFlag } from './TeamFlag'

import { formatSeasonQuestionnaireLockHint } from '../lib/seasonQuestionnaireLock'
import type { Match } from '../lib/types'

interface SeasonQuestionnaireProps {
  onComplete: () => void
  onSubmit: (answers: SeasonAnswers) => Promise<void>
  onSkip?: () => void
  matches?: Match[]
  /** Prefill when re-editing existing season picks. */
  initialAnswers?: SeasonAnswers
  /** Re-edit before Quarter-finals — skips “Skip for now”, different copy. */
  editMode?: boolean
  lockHint?: string
}

function PitchProgress({ step, total }: { step: number; total: number }) {
  const pct = ((step + 1) / total) * 100
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-simelabs-dark via-simelabs to-simelabs-light"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 8px, rgb(255 255 255 / 0.15) 8px, rgb(255 255 255 / 0.15) 16px)',
        }}
      />
    </div>
  )
}

function TeamGrid({
  selected,
  onSelect,
  exclude,
}: {
  selected: string | undefined
  onSelect: (team: string) => void
  exclude?: string
}) {
  const teams = useMemo(
    () => (exclude ? WC_TEAMS.filter((t) => t !== exclude) : WC_TEAMS),
    [exclude],
  )

  return (
    <div className="grid max-h-[min(42vh,320px)] grid-cols-3 gap-2 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-4">
      {teams.map((team) => {
        const active = selected === team
        return (
          <motion.button
            key={team}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              playSound('select')
              onSelect(team)
            }}
            aria-pressed={active}
            className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
              active
                ? 'border-simelabs bg-simelabs/15 shadow-glow-sm ring-1 ring-simelabs/40'
                : 'border-default bg-card/80 hover:border-simelabs/30 hover:bg-muted'
            }`}
          >
            <TeamFlag team={team} emoji="" size="sm" />
            <span className="line-clamp-2 text-[10px] font-medium leading-tight text-theme sm:text-xs">
              {team}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

function PlayerPicker({
  selected,
  onSelect,
  custom,
  onCustomChange,
}: {
  selected: string | undefined
  onSelect: (name: string) => void
  custom: string
  onCustomChange: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid max-h-[min(32vh,240px)] grid-cols-2 gap-2 overflow-y-auto overscroll-contain sm:grid-cols-3">
        {GOLDEN_BOOT_CANDIDATES.map((name) => {
          const active = selected === name
          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                playSound('select')
                onSelect(name)
              }}
              aria-pressed={active}
              className={`rounded-xl border px-2 py-2.5 text-left text-xs font-medium transition sm:text-sm ${
                active
                  ? 'border-simelabs bg-simelabs/15 text-simelabs ring-1 ring-simelabs/35'
                  : 'border-default bg-card hover:bg-muted'
              }`}
            >
              {name}
            </button>
          )
        })}
      </div>
      <div>
        <label htmlFor="golden-boot-custom" className="type-caption mb-1.5 block font-medium">
          Or type another player
        </label>
        <input
          id="golden-boot-custom"
          type="text"
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="Player name"
          className="input-field"
          autoComplete="off"
        />
      </div>
    </div>
  )
}

function QuestionStep({
  question,
  answers,
  onAnswer,
  playerCustom,
  onPlayerCustom,
}: {
  question: SeasonQuestion
  answers: SeasonAnswers
  onAnswer: (key: SeasonQuestion['key'], value: string) => void
  playerCustom: string
  onPlayerCustom: (v: string) => void
}) {
  const value = answers[question.key]

  return (
    <motion.div
      key={question.key}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-1 flex-col"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-simelabs/20 to-simelabs-dark/20 text-2xl ring-1 ring-simelabs/25">
          {question.icon}
        </div>
        <div className="min-w-0 flex-1">
          <span className="type-overline !text-[10px]">{question.badge}</span>
          <h2 className="type-section-title mt-0.5">{question.title}</h2>
          <p className="type-body-sm mt-1 text-muted">{question.subtitle}</p>
          {question.points > 0 && (
            <p className="mt-1.5 inline-flex rounded-full bg-simelabs/15 px-2 py-0.5 text-xs font-bold text-simelabs">
              +{question.points} pts if correct
            </p>
          )}
          {question.hint && (
            <p className="type-caption mt-2 text-pretty">{question.hint}</p>
          )}
        </div>
      </div>

      {question.type === 'team' ? (
        <TeamGrid
          selected={value}
          onSelect={(team) => onAnswer(question.key, team)}
          exclude={
            question.key === 'runner_up' ? answers.world_cup_winner : undefined
          }
        />
      ) : (
        <PlayerPicker
          selected={value}
          onSelect={(name) => onAnswer(question.key, name)}
          custom={playerCustom}
          onCustomChange={onPlayerCustom}
        />
      )}
    </motion.div>
  )
}

export function SeasonQuestionnaire({
  onComplete,
  onSubmit,
  onSkip,
  matches = [],
  initialAnswers,
  editMode = false,
  lockHint,
}: SeasonQuestionnaireProps) {
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<SeasonAnswers>(() => ({ ...initialAnswers }))
  const [playerCustom, setPlayerCustom] = useState(() => {
    const boot = initialAnswers?.golden_boot?.trim()
    if (!boot) return ''
    return GOLDEN_BOOT_CANDIDATES.includes(boot) ? '' : boot
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const question = SEASON_QUESTIONS[step]
  const isLast = step === SEASON_QUESTIONS.length - 1

  const currentValue = answers[question.key]?.trim()
  const goldenBootOk =
    question.key !== 'golden_boot' || Boolean(currentValue || playerCustom.trim())
  const canContinue = Boolean(currentValue || (question.key === 'golden_boot' && playerCustom.trim())) && goldenBootOk

  const setAnswer = (key: SeasonQuestion['key'], value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (key === 'golden_boot') setPlayerCustom('')
  }

  const goNext = async () => {
    setError(null)
    let nextAnswers = { ...answers }
    if (question.key === 'golden_boot' && !nextAnswers.golden_boot?.trim() && playerCustom.trim()) {
      nextAnswers = { ...nextAnswers, golden_boot: playerCustom.trim() }
      setAnswers(nextAnswers)
    }

    if (!nextAnswers[question.key]?.trim()) return

    if (!isLast) {
      playSound('swipe')
      setStep((s) => s + 1)
      return
    }

    playSound('save')
    setSubmitting(true)
    try {
      await onSubmit(nextAnswers)
      if (!reduceMotion) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#26cb99', '#009688', '#ffffff'],
        })
      }
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save picks')
    } finally {
      setSubmitting(false)
    }
  }

  const hint =
    lockHint ??
    (editMode
      ? 'One re-edit before Quarter-finals — then season picks lock for good'
      : `${formatSeasonQuestionnaireLockHint(matches)} · Match predictions need season picks first`)

  return (
    <div
      className="fixed inset-0 z-[190] flex flex-col overflow-hidden bg-page text-theme safe-top safe-bottom"
      role="dialog"
      aria-modal="true"
      aria-labelledby="season-questionnaire-title"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-simelabs/15 blur-3xl" />
        <div className="absolute -left-16 bottom-20 h-56 w-56 rounded-full bg-simelabs-dark/10 blur-3xl" />
        <div
          className="absolute bottom-0 left-0 right-0 h-32 opacity-20"
          style={{
            background:
              'linear-gradient(to top, rgb(38 203 153 / 0.25), transparent), repeating-linear-gradient(90deg, rgb(38 203 153 / 0.08) 0, rgb(38 203 153 / 0.08) 40px, transparent 40px, transparent 80px)',
          }}
        />
      </div>

      <header className="relative z-10 border-b border-default/80 bg-elevated/90 px-4 py-4 backdrop-blur-md">
        <p id="season-questionnaire-title" className="type-overline">
          {editMode ? 'Season specials · QF edit' : 'Season specials'}
        </p>
        <h1 className="type-page-title mt-1">
          {editMode ? 'Tweak your season picks' : 'Build your World Cup dossier'}
        </h1>
        <p className="type-caption mt-1 text-pretty">
          {editMode ? (
            <>
              Golden Boot, winner, dark horse &amp; more — last change before QF. Still worth up to{' '}
              <span className="font-semibold text-simelabs">{MAX_SEASON_BONUS} bonus pts</span> after
              the Final.
            </>
          ) : (
            <>
              Like IPL caps — Golden Boot, dark horses &amp; the champion. Up to{' '}
              <span className="font-semibold text-simelabs">{MAX_SEASON_BONUS} bonus pts</span> after
              the Final.
            </>
          )}
        </p>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between type-caption font-medium">
            <span>
              Question {step + 1} of {SEASON_QUESTIONS.length}
            </span>
            <span className="text-simelabs">{question.badge}</span>
          </div>
          <PitchProgress step={step} total={SEASON_QUESTIONS.length} />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col overflow-hidden px-4 py-4">
        <AnimatePresence mode="wait">
          <QuestionStep
            key={question.key}
            question={question}
            answers={answers}
            onAnswer={setAnswer}
            playerCustom={playerCustom}
            onPlayerCustom={(v) => {
              setPlayerCustom(v)
              if (v.trim()) setAnswer('golden_boot', v.trim())
            }}
          />
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-default bg-elevated/95 px-4 py-4 backdrop-blur-md">
        {error && (
          <p className="mb-3 text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => {
                playSound('swipe')
                setStep((s) => s - 1)
              }}
              disabled={submitting}
              className="flex-1 rounded-xl border border-default py-3.5 text-sm font-semibold text-subtle transition hover:bg-muted disabled:opacity-50"
            >
              Back
            </button>
          )}
          {editMode && step === 0 && (
            <button
              type="button"
              onClick={onComplete}
              disabled={submitting}
              className="flex-1 rounded-xl border border-default py-3.5 text-sm font-semibold text-subtle transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => void goNext()}
            disabled={!canContinue || submitting}
            className="btn-primary flex-[2] !w-auto"
          >
            {submitting
              ? 'Saving…'
              : isLast
                ? editMode
                  ? 'Save updated picks ⚽'
                  : 'Kick off my picks ⚽'
                : 'Next'}
          </button>
        </div>
        {!editMode && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={submitting}
            className="type-caption mt-3 w-full text-center font-medium text-muted transition hover:text-theme disabled:opacity-50"
          >
            Skip for now — complete later from Profile
          </button>
        )}
        <p className="type-caption mt-2 text-center text-pretty">{hint}</p>
      </footer>
    </div>
  )
}
