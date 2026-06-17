import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import { useMealChallenges } from './useMealChallenges'
import {
  dismissEngagementPrompt,
  getLeaderboardPromptMessage,
  getMealBetPromptMessage,
  getPredictPromptMessage,
  resolveEngagementPrompt,
  type EngagementPrompt,
} from '../lib/engagementPrompts'
import { markMealBetSeen } from '../lib/mealBetNotifications'
import { showGameNotification } from '../lib/notificationTheme'

export function useEngagementPrompt() {
  const { user } = useAuth()
  const { matches, predictions, loading } = useMatches()
  const { live: liveMealBets, loading: mealsLoading } = useMealChallenges(matches)
  const location = useLocation()
  const navigate = useNavigate()
  const [hidden, setHidden] = useState(false)
  const notifiedRef = useRef<string | null>(null)

  const mealBetLabels = useMemo(() => {
    const map = new Map<
      string,
      { creatorName: string; claimText: string; stakeText: string; match: (typeof liveMealBets)[0]['match'] }
    >()
    for (const c of liveMealBets) {
      if (c.match) {
        map.set(c.id, {
          creatorName: c.creator_name,
          claimText: c.claim_text,
          stakeText: c.stake_text,
          match: c.match,
        })
      }
    }
    return map
  }, [liveMealBets])

  const prompt = useMemo<EngagementPrompt | null>(() => {
    if (!user || loading || mealsLoading || hidden) return null
    return resolveEngagementPrompt({
      matches,
      predictions,
      pathname: location.pathname,
      userId: user.id,
      liveMealBets,
      mealBetLabels: mealBetLabels as Map<
        string,
        { creatorName: string; claimText: string; stakeText: string; match: NonNullable<(typeof liveMealBets)[0]['match']> }
      >,
    })
  }, [
    user,
    loading,
    mealsLoading,
    hidden,
    matches,
    predictions,
    location.pathname,
    liveMealBets,
    mealBetLabels,
  ])

  useEffect(() => {
    setHidden(false)
  }, [location.pathname])

  useEffect(() => {
    if (!prompt || notifiedRef.current === prompt.key) return

    const message =
      prompt.kind === 'predict'
        ? getPredictPromptMessage(prompt)
        : prompt.kind === 'meal'
          ? getMealBetPromptMessage(prompt)
          : getLeaderboardPromptMessage(prompt)

    const url =
      prompt.kind === 'predict' ? '/predict' : prompt.kind === 'meal' ? '/meals' : '/leaderboard'
    const kind =
      prompt.kind === 'predict' ? 'predict' : prompt.kind === 'meal' ? 'meal' : 'leaderboard'

    void showGameNotification({
      title: message.title,
      body: message.body,
      tag: prompt.key,
      kind,
      url,
    })
    notifiedRef.current = prompt.key
  }, [prompt])

  const dismiss = useCallback(() => {
    if (prompt) {
      dismissEngagementPrompt(prompt.key)
      if (prompt.kind === 'meal') {
        markMealBetSeen(prompt.challengeId)
      }
    }
    setHidden(true)
  }, [prompt])

  const goToAction = useCallback(() => {
    if (!prompt) return
    dismissEngagementPrompt(prompt.key)
    if (prompt.kind === 'meal') {
      markMealBetSeen(prompt.challengeId)
    }
    setHidden(true)
    navigate(
      prompt.kind === 'predict' ? '/predict' : prompt.kind === 'meal' ? '/meals' : '/leaderboard',
    )
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
