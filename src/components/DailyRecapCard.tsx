import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useMatches } from '../hooks/useMatches'
import { buildDailyRecap } from '../lib/recap'

export function DailyRecapCard() {
  const { user } = useAuth()
  const { matches, predictions } = useMatches()
  const { entries } = useLeaderboard()

  const recap = useMemo(() => {
    const rank = user ? entries.find((e) => e.user_id === user.id)?.rank : null
    return buildDailyRecap(matches, predictions, rank)
  }, [matches, predictions, entries, user])

  return (
    <div className="rounded-2xl border border-simelabs/25 bg-gradient-to-br from-simelabs/10 to-transparent p-4">
      <p className="type-overline !text-simelabs">Daily recap</p>
      <h3 className="type-section-title mt-1">{recap.title}</h3>
      <p className="type-body-sm mt-2 text-pretty text-subtle">{recap.body}</p>
      {recap.openCount > 0 && (
        <Link
          to="/predict"
          className="mt-3 inline-flex text-sm font-semibold text-simelabs hover:underline"
        >
          {recap.openCount} match{recap.openCount === 1 ? '' : 'es'} need picks →
        </Link>
      )}
    </div>
  )
}
