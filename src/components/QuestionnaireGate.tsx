import type { ReactNode } from 'react'
import { SeasonQuestionnaireProvider } from '../contexts/SeasonQuestionnaireContext'

export function QuestionnaireGate({ children }: { children: ReactNode }) {
  return <SeasonQuestionnaireProvider>{children}</SeasonQuestionnaireProvider>
}
