import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import {
  dismissEngagementPrompt,
  getLeaderboardPromptMessage,
  getPredictPromptMessage,
  maybeShowSystemNotification,
  resolveEngagementPrompt,
  type EngagementPrompt,
} from '../lib/engagementPrompts'

export function useEngagementPrompt() {
  const { user } = useAuth()
  const { matches, predictions, loading } = useMatches()
  const location = useLocation()
  const navigate = useNavigate()
  const [hidden, setHidden] = useState(false)
  const notifiedRef = useRef<string | null>(null)

  const prompt = useMemo<EngagementPrompt | null>(() => {
    if (!user || loading || hidden) return null
    return resolveEngagementPrompt({
      matches,
      predictions,
      pathname: location.pathname,
    })
  }, [user, loading, hidden, matches, predictions, location.pathname])

  useEffect(() => {
    setHidden(false)
  }, [location.pathname])

  useEffect(() => {
    if (!prompt || notifiedRef.current === prompt.key) return

    const message =
      prompt.kind === 'predict'
        ? getPredictPromptMessage(prompt)
        : getLeaderboardPromptMessage(prompt)

    void maybeShowSystemNotification(message.title, message.body, prompt.key)
    notifiedRef.current = prompt.key
  }, [prompt])

  const dismiss = useCallback(() => {
    if (prompt) {
      dismissEngagementPrompt(prompt.key)
    }
    setHidden(true)
  }, [prompt])

  const goToAction = useCallback(() => {
    if (!prompt) return
    dismissEngagementPrompt(prompt.key)
    setHidden(true)
    navigate(prompt.kind === 'predict' ? '/predict' : '/leaderboard')
  }, [prompt, navigate])

  const requestNotifications = useCallback(async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }, [])

  return {
    prompt,
    dismiss,
    goToAction,
    requestNotifications,
    notificationsSupported: typeof window !== 'undefined' && 'Notification' in window,
    notificationsEnabled:
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted',
  }
}
