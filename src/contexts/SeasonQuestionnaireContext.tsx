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
import { pushGameNotification } from '../lib/gameNotificationBus'

interface SeasonQuestionnaireContextValue {
  ready: boolean
  hasSubmitted: boolean
  isLocked: boolean
  canPredictMatches: boolean
  needsSeasonPicks: boolean
  openQuestionnaire: () => void
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
    submit,
    skipForNow,
  } = useSeasonQuestionnaire()

  const [manualOpen, setManualOpen] = useState(false)
  const loginReminderSent = useRef(false)

  const showQuestionnaire = (shouldAutoShowQuestionnaire || manualOpen) && needsSeasonPicks

  const openQuestionnaire = useCallback(() => {
    setManualOpen(true)
  }, [])

  const handleComplete = useCallback(() => {
    setManualOpen(false)
  }, [])

  const handleSkip = useCallback(async () => {
    await skipForNow()
    setManualOpen(false)
  }, [skipForNow])

  const canPredictMatches = hasSubmitted || isLocked

  useEffect(() => {
    if (!ready || !needsSeasonPicks || loginReminderSent.current) return
    if (showQuestionnaire) return

    loginReminderSent.current = true
    pushGameNotification({
      kind: 'predict',
      title: 'Complete your season picks',
      body: 'Golden Boot, winner, dark horse & more — open through group stage. Required before match predictions.',
      url: '/profile',
      action: 'open-season-questionnaire',
    })
  }, [ready, needsSeasonPicks, showQuestionnaire])

  useEffect(() => {
    if (!profile?.id) loginReminderSent.current = false
  }, [profile?.id])

  const value = useMemo(
    () => ({
      ready,
      hasSubmitted,
      isLocked,
      canPredictMatches,
      needsSeasonPicks,
      openQuestionnaire,
      skipForNow: handleSkip,
    }),
    [ready, hasSubmitted, isLocked, canPredictMatches, needsSeasonPicks, openQuestionnaire, handleSkip],
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
            key="season-questionnaire"
            matches={matches}
            onSubmit={submit}
            onComplete={handleComplete}
            onSkip={() => void handleSkip()}
          />
        )}
      </AnimatePresence>
    </SeasonQuestionnaireContext.Provider>
  )
}
