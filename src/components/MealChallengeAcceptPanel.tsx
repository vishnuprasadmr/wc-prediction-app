import { useState } from 'react'

import type { MealChallengeView } from '../hooks/useMealChallenges'
import { acceptMealChallenge } from '../hooks/useMealChallenges'
import { acceptorBetLine, mealClaimOutcomeLabel } from '../lib/mealChallenges'
import { canAcceptMealBet } from '../lib/mealChallenges'

const MEAL_BET_STAKE = 1 as const

export function MealChallengeAcceptPanel({
  challenge,
  userId,
  onAccepted,
}: {
  challenge: MealChallengeView
  userId: string
  onAccepted: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (challenge.creator_id === userId) return null

  const match = challenge.match
  const locked = !canAcceptMealBet(match)
  const existing = challenge.acceptances.find((a) => a.user_id === userId)

  if (existing) {
    return (
      <div className="w-full space-y-2 rounded-xl border border-simelabs/25 bg-simelabs/5 p-3">
        <p className="text-xs font-semibold text-simelabs">
          You accepted for <span className="font-bold">1 pt</span>
        </p>
        <p className="text-[11px] text-pretty text-muted">
          {acceptorBetLine({
            backedOutcome: challenge.backed_outcome,
            match: match ?? undefined,
            homePred: existing.home_pred,
            awayPred: existing.away_pred,
          })}
        </p>
      </div>
    )
  }

  if (locked) {
    return (
      <p className="text-xs text-muted">Point acceptance closed for this match.</p>
    )
  }

  const accept = async () => {
    setBusy(true)
    setMessage(null)
    const result = await acceptMealChallenge(challenge.id, MEAL_BET_STAKE)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    onAccepted()
  }

  return (
    <div className="w-full space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
      <p className="text-xs font-semibold text-theme">Take the bet — stake 1 league point</p>
      <p className="text-[11px] text-pretty text-muted">
        You bet the creator is wrong on{' '}
        <span className="font-medium text-theme">
          {mealClaimOutcomeLabel(challenge.backed_outcome, match ?? undefined)}
        </span>
        . Win or lose <span className="font-medium text-theme">1 pt</span> — meal bets stay small so
        the table isn&apos;t swung by one call.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void accept()}
        className="w-full rounded-lg bg-amber-500 py-2 text-xs font-bold text-black disabled:opacity-50"
      >
        {busy ? 'Accepting…' : 'Accept for 1 pt'}
      </button>
      {message && <p className="text-center text-[11px] text-red-400">{message}</p>}
    </div>
  )
}
