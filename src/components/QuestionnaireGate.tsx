import { useState, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSeasonQuestionnaire } from '../hooks/useSeasonQuestionnaire'
import { SeasonQuestionnaire } from './SeasonQuestionnaire'

export function QuestionnaireGate({ children }: { children: ReactNode }) {
  const { needsQuestionnaire, loading, submit } = useSeasonQuestionnaire()
  const [dismissed, setDismissed] = useState(false)

  const show = needsQuestionnaire && !dismissed

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-simelabs border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {show && (
          <SeasonQuestionnaire
            key="season-questionnaire"
            onSubmit={submit}
            onComplete={() => setDismissed(true)}
          />
        )}
      </AnimatePresence>
      {!show && children}
    </>
  )
}
