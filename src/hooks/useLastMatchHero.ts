import { useMemo } from 'react'
import { getLastFinishedMatch } from '../lib/matchUtils'
import type { Match } from '../lib/types'
import { useMatchHero } from './useMatchHero'

export function useLastMatchHero(matches: Match[]) {
  const lastMatch = useMemo(() => getLastFinishedMatch(matches), [matches])
  const { hero, loading, error } = useMatchHero(lastMatch)
  return { lastMatch, hero, loading, error }
}
