import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import { useMealChallenges } from './useMealChallenges'
import { pushGameNotification } from '../lib/gameNotificationBus'
import {
  countUnseenActionableMealBets,
  isActionableMealBet,
  markMealAcceptNotified,
  markMealBetNotified,
  markMealSettleNotified,
  wasMealAcceptNotified,
  wasMealBetNotified,
  wasMealSettleNotified,
} from '../lib/mealBetNotifications'
import { mealClaimOutcomeLabel } from '../lib/mealChallenges'
import { showGameNotification } from '../lib/notificationTheme'

/** In-app toast + optional push when a meal bet goes live or settles. */
export function useMealBetNotifications() {
  const { user } = useAuth()
  const { matches } = useMatches()
  const { live, settled, loading } = useMealChallenges(matches)
  const checkingRef = useRef(false)

  useEffect(() => {
    if (!user?.id || loading) return undefined

    const check = () => {
      if (checkingRef.current) return
      checkingRef.current = true

      try {
        for (const challenge of live) {
          if (challenge.creator_id === user.id) {
            for (const acceptance of challenge.acceptances) {
              if (wasMealAcceptNotified(acceptance.id)) continue

              markMealAcceptNotified(acceptance.id)
              const match = challenge.match
              const claim = mealClaimOutcomeLabel(challenge.backed_outcome, match)
              const title = 'Someone took your meal bet!'
              const body = `${acceptance.display_name} staked ${acceptance.points_staked} pts vs ${claim} — ${match?.home_team ?? 'Match'} vs ${match?.away_team ?? ''}`

              pushGameNotification({ title, body, url: '/meals', kind: 'meal' })
              void showGameNotification({
                title,
                body,
                tag: `meal-accept:${acceptance.id}`,
                kind: 'meal',
                url: '/meals',
              })
            }
          }

          if (!isActionableMealBet(challenge, user.id)) continue
          if (wasMealBetNotified(challenge.id)) continue

          markMealBetNotified(challenge.id)
          const match = challenge.match!
          const title = 'New meal bet!'
          const body = `${challenge.creator_name} says “${challenge.claim_text}” — stake points on ${match.home_team} vs ${match.away_team}`

          pushGameNotification({ title, body, url: '/meals', kind: 'meal' })
          void showGameNotification({
            title,
            body,
            tag: `meal-live:${challenge.id}`,
            kind: 'meal',
            url: '/meals',
          })
        }

        for (const challenge of settled) {
          if (wasMealSettleNotified(challenge.id)) continue
          if (!challenge.winner_name) continue

          const involved =
            challenge.creator_id === user.id ||
            challenge.winner_user_id === user.id ||
            challenge.acceptances.some((a) => a.user_id === user.id)

          if (!involved) continue

          markMealSettleNotified(challenge.id)
          const title = 'Meal winner!'
          const body = `${challenge.winner_name} wins — ${challenge.stake_text}`

          pushGameNotification({ title, body, url: '/meals', kind: 'meal' })
          void showGameNotification({
            title,
            body,
            tag: `meal-result:${challenge.id}`,
            kind: 'meal',
            url: '/meals',
          })
        }
      } finally {
        checkingRef.current = false
      }
    }

    check()
    const id = window.setInterval(check, 20_000)
    return () => window.clearInterval(id)
  }, [user?.id, loading, live, settled])
}

export function useUnseenMealBetCount(): number {
  const { user } = useAuth()
  const { matches } = useMatches()
  const { live, loading } = useMealChallenges(matches)

  if (!user?.id || loading) return 0
  return countUnseenActionableMealBets(live, user.id)
}
