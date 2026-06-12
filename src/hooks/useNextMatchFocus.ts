import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  hasSeenMatchSpotlight,
  markMatchSpotlightSeen,
  type SpotlightSurface,
} from '../lib/matchSpotlight'
import type { Match } from '../lib/types'

interface UseNextMatchFocusOptions {
  surface: SpotlightSurface
  pathname: string
  loading: boolean
  focusMatch: Match | null
  scrollTargetId?: string
}

export function useNextMatchFocus({
  surface,
  pathname,
  loading,
  focusMatch,
  scrollTargetId = 'match',
}: UseNextMatchFocusOptions) {
  const location = useLocation()
  const [spotlightActive, setSpotlightActive] = useState(() => !hasSeenMatchSpotlight(surface))

  useEffect(() => {
    if (location.pathname !== pathname || loading || !focusMatch) return undefined

    const elementId = `${scrollTargetId}-${focusMatch.id}`

    const scrollToCard = () => {
      document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const id = window.setTimeout(scrollToCard, 400)
    const retry = window.setTimeout(scrollToCard, 650)

    return () => {
      window.clearTimeout(id)
      window.clearTimeout(retry)
    }
  }, [location.key, location.pathname, pathname, loading, focusMatch, scrollTargetId])

  useEffect(() => {
    if (!spotlightActive || !focusMatch) return undefined
    const id = window.setTimeout(() => {
      markMatchSpotlightSeen(surface)
      setSpotlightActive(false)
    }, 8000)
    return () => window.clearTimeout(id)
  }, [spotlightActive, focusMatch, surface])

  const dismissSpotlight = () => {
    if (spotlightActive) {
      markMatchSpotlightSeen(surface)
      setSpotlightActive(false)
    }
  }

  return { spotlightActive, dismissSpotlight }
}
