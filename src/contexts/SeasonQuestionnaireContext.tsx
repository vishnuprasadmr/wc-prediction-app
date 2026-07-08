import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence } from 'framer-motion'
import { SeasonQuestionnaire } from '../components/SeasonQuestionnaire'
import { useAuth } from './AuthContext'
import { useMatches } from '../hooks/useMatches'
import { useSeasonQuestionnaire } from '../hooks/useSeasonQuestionnaire'
import { useSeasonEditPoll } from '../hooks/useSeasonEditPoll'
import { pushGameNotification } from '../lib/gameNotificationBus'
import { formatSeasonEditLockHint } from '../lib/seasonEditPoll'
import type { SeasonAnswers } from '../lib/seasonQuestions'

interface SeasonQuestionnaireContextValue {
  ready: boolean
  hasSubmitted: boolean
  isLocked: boolean
  canPredictMatches: boolean
  needsSeasonPicks: boolean
  canEditSeasonPicks: boolean
  openQuestionnaire: () => void
  openSeasonEdit: () => void
  skipForNow: () => Promise<void>
}

const SeasonQuestionnaireContext = createContext<SeasonQuestionnaireContextValue | null>(null)

export function useSeasonQuestionnaireContext(): SeasonQuestionnaireContextValue {
  const ctx = useContext(SeasonQuestionnaireContext)
  if (!ctx) {
    throw new Error('useSeasonQuestionnaireContext must be used within SeasonQuestionnaireProvider')
  }
  return ctx
}

export function useSeasonQuestionnaireContextOptional(): SeasonQuestionnaireContextValue | null {
  return useContext(SeasonQuestionnaireContext)
}

export function SeasonQuestionnaireProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const { matches } = useMatches()
  const {
    ready,
    gateBlocking,
    hasSubmitted,
    isLocked,
    needsSeasonPicks,
    shouldAutoShowQuestionnaire,
    unavailable,
    row,
    submit,
    skipForNow,
  } = useSeasonQuestionnaire()
  const { editAllowed } = useSeasonEditPoll()

  const [manualOpen, setManualOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const loginReminderSent = useRef(false)

  /** One re-edit of already-submitted season picks during admin-opened QF window. */
  const canEditSeasonPicks = editAllowed && hasSubmitted

  /**
   * Original incomplete flow OR reopen window for players who never finished season picks
   * (edit window lifts the R32 client lock for first-time submit).
   */
  const needsPicksNow =
    needsSeasonPicks || (editAllowed && !hasSubmitted && ready && !unavailable)

  const showInitialQuestionnaire =
    !editOpen &&
    needsPicksNow &&
    (shouldAutoShowQuestionnaire ||
      manualOpen ||
      (editAllowed && !hasSubmitted && !profile?.questionnaire_skipped_at))

  const showEditQuestionnaire = editOpen && canEditSeasonPicks
  const showQuestionnaire = showInitialQuestionnaire || showEditQuestionnaire

  const openQuestionnaire = useCallback(() => {
    setEditOpen(false)
    setManualOpen(true)
  }, [])

  const openSeasonEdit = useCallback(() => {
    if (!canEditSeasonPicks) return
    setManualOpen(false)
    setEditOpen(true)
  }, [canEditSeasonPicks])

  const handleComplete = useCallback(() => {
    setManualOpen(false)
    setEditOpen(false)
  }, [])

  const handleSkip = useCallback(async () => {
    await skipForNow()
    setManualOpen(false)
  }, [skipForNow])

  const handleSubmit = useCallback(
    async (answers: SeasonAnswers) => {
      await submit(answers)
    },
    [submit],
  )

  const canPredictMatches = hasSubmitted || (isLocked && !editAllowed)

  useEffect(() => {
    if (!ready || !needsPicksNow || loginReminderSent.current) return
    if (showInitialQuestionnaire) return

    loginReminderSent.current = true
    pushGameNotification({
      kind: 'predict',
      title: editAllowed ? 'Season picks reopened' : 'Complete your season picks',
      body: editAllowed
        ? 'One more chance before Quarter-finals — Golden Boot, winner, dark horse & more.'
        : 'Golden Boot, winner, dark horse & more — open through group stage. Required before match predictions.',
      url: '/profile',
      action: 'open-season-questionnaire',
    })
  }, [ready, needsPicksNow, showInitialQuestionnaire, editAllowed])

  useEffect(() => {
    if (!profile?.id) loginReminderSent.current = false
  }, [profile?.id])

  const value = useMemo(
    () => ({
      ready,
      hasSubmitted,
      isLocked,
      canPredictMatches,
      needsSeasonPicks: needsPicksNow,
      canEditSeasonPicks,
      openQuestionnaire,
      openSeasonEdit,
      skipForNow: handleSkip,
    }),
    [
      ready,
      hasSubmitted,
      isLocked,
      canPredictMatches,
      needsPicksNow,
      canEditSeasonPicks,
      openQuestionnaire,
      openSeasonEdit,
      handleSkip,
    ],
  )

  return (
    <SeasonQuestionnaireContext.Provider value={value}>
      {gateBlocking ? (
        <div className="flex min-h-dvh items-center justify-center bg-page">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-simelabs border-t-transparent"
            role="status"
            aria-label="Loading"
          />
        </div>
      ) : (
        children
      )}
      <AnimatePresence>
        {showQuestionnaire && (
          <SeasonQuestionnaire
            key={showEditQuestionnaire ? 'season-edit' : 'season-questionnaire'}
            matches={matches}
            onSubmit={handleSubmit}
            onComplete={handleComplete}
            onSkip={showEditQuestionnaire ? undefined : () => void handleSkip()}
            initialAnswers={showEditQuestionnaire ? row?.answers : undefined}
            editMode={showEditQuestionnaire}
            lockHint={
              showEditQuestionnaire || editAllowed
                ? formatSeasonEditLockHint(matches)
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </SeasonQuestionnaireContext.Provider>
  )
}
