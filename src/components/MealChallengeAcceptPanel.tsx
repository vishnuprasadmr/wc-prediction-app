import { useState } from 'react'

import type { MealChallengeView } from '../hooks/useMealChallenges'
import { acceptMealChallenge } from '../hooks/useMealChallenges'
import { MEAL_CHALLENGE_POINT_STAKES, type MealChallengePointStake } from '../lib/mealChallenges'
import { isMatchLocked } from '../lib/matchUtils'



export function MealChallengeAcceptPanel({

  challenge,

  userId,

  onAccepted,

}: {

  challenge: MealChallengeView

  userId: string

  onAccepted: () => void

}) {

  const [stake, setStake] = useState<MealChallengePointStake>(2)

  const [busy, setBusy] = useState(false)

  const [message, setMessage] = useState<string | null>(null)



  if (challenge.creator_id === userId) return null



  const existing = challenge.acceptances.find((a) => a.user_id === userId)

  if (existing) {

    return (

      <p className="text-xs text-simelabs">

        You accepted for <span className="font-semibold">{existing.points_staked} pts</span> —

        betting the claim fails.

      </p>

    )

  }



  const match = challenge.match

  if (!match || isMatchLocked(match)) {

    return (

      <p className="text-xs text-muted">Point acceptance closed for this match.</p>

    )

  }



  const accept = async () => {

    setBusy(true)

    setMessage(null)

    const result = await acceptMealChallenge(challenge.id, stake)

    setBusy(false)

    if (!result.ok) {

      setMessage(result.message)

      return

    }

    onAccepted()

  }



  return (

    <div className="w-full space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">

      <p className="text-xs font-semibold text-theme">Take the bet — stake league points</p>

      <p className="text-[11px] text-pretty text-muted">

        You bet the creator is wrong. If their claim comes true, you lose your stake. If not, you

        win the same points from them.

      </p>

      <div className="flex flex-wrap gap-1.5">

        {MEAL_CHALLENGE_POINT_STAKES.map((pts) => (

          <button

            key={pts}

            type="button"

            onClick={() => setStake(pts)}

            className={`rounded-full px-3 py-1 text-xs font-semibold ${

              stake === pts ? 'bg-amber-500 text-black' : 'bg-muted text-muted'

            }`}

          >

            {pts} pts

          </button>

        ))}

      </div>

      <button

        type="button"

        disabled={busy}

        onClick={() => void accept()}

        className="w-full rounded-lg bg-amber-500 py-2 text-xs font-bold text-black disabled:opacity-50"

      >

        {busy ? 'Accepting…' : `Accept for ${stake} pts`}

      </button>

      {message && <p className="text-center text-[11px] text-red-400">{message}</p>}

    </div>

  )

}

