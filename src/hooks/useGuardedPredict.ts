import { useCallback } from 'react'
import { useSeasonQuestionnaireContext } from '../contexts/SeasonQuestionnaireContext'
import type { Match } from '../lib/types'

export function useGuardedPredict(onSelect: (match: Match) => void) {
  const { canPredictMatches, openQuestionnaire } = useSeasonQuestionnaireContext()

  return useCallback(
    (match: Match) => {
      if (!canPredictMatches) {
        openQuestionnaire()
        return
      }
      onSelect(match)
    },
    [canPredictMatches, openQuestionnaire, onSelect],
  )
}
