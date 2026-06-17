import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from '../hooks/useMatches'
import {
  approveMealChallenge,
  rejectMealChallenge,
  settleMealChallenge,
  useMealChallenges,
  type MealChallengeView,
} from '../hooks/useMealChallenges'
import { MealChallengeCard } from './MealChallengeCard'

type Section = 'pending' | 'live' | 'settle'

export function AdminMealChallengesPanel() {
  const { user } = useAuth()
  const { matches } = useMatches()
  const { pending, live, loading, error, refetch } = useMealChallenges(matches)
  const [section, setSection] = useState<Section>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id)
    setMessage(null)
    await action()
    await refetch()
    setBusyId(null)
  }

  const approve = (c: MealChallengeView) =>
    run(c.id, async () => {
      if (!user?.id) return
      const { error } = await approveMealChallenge(c.id, user.id)
      setMessage(error ? error.message : `Approved: ${c.claim_text}`)
    })

  const reject = (c: MealChallengeView) =>
    run(c.id, async () => {
      const reason = window.prompt('Reason for rejection (optional):') ?? 'Not approved'
      const { error } = await rejectMealChallenge(c.id, reason)
      setMessage(error ? error.message : 'Challenge rejected')
    })

  const settle = (c: MealChallengeView) =>
    run(c.id, async () => {
      if (!user?.id || !c.match) return
      const result = await settleMealChallenge(c, c.match, user.id)
      if (result.error) {
        setMessage(result.error)
        return
      }
      const parts = [
        result.winner ? `Meal → ${result.winner}` : 'No meal winner',
        c.acceptances.length > 0
          ? `Points → claim ${result.claimCorrect ? 'held' : 'failed'} (creator ${(result.creatorPointsDelta ?? 0) >= 0 ? '+' : ''}${result.creatorPointsDelta ?? 0})`
          : null,
      ].filter(Boolean)
      setMessage(`Settled — ${parts.join(' · ')}`)
    })

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-muted" />

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        Meal challenges unavailable: {error}
      </div>
    )
  }

  const readyToSettle = live.filter((c) => c.match?.status === 'finished')
  const totalAcceptors = live.reduce((sum, c) => sum + c.acceptances.length, 0)

  return (
    <div className="rounded-2xl border border-[#E23744]/25 bg-[#E23744]/5 p-4">
      <h3 className="type-section-title">Meal bets</h3>
      <p className="type-caption mt-1 text-pretty">
        Approve, monitor who accepted (player · stake · time), and settle after full time.
      </p>

      {message && <p className="mt-3 text-sm text-simelabs">{message}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSection('pending')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            section === 'pending' ? 'bg-[#E23744] text-white' : 'bg-muted text-muted'
          }`}
        >
          Pending ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setSection('live')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            section === 'live' ? 'bg-amber-500 text-black' : 'bg-muted text-muted'
          }`}
        >
          Live ({live.length})
        </button>
        <button
          type="button"
          onClick={() => setSection('settle')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            section === 'settle' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted'
          }`}
        >
          Settle ({readyToSettle.length})
        </button>
      </div>

      {section === 'live' && live.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          {totalAcceptors} point bet{totalAcceptors === 1 ? '' : 's'} across {live.length} live
          challenge{live.length === 1 ? '' : 's'}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {section === 'pending' &&
          (pending.length === 0 ? (
            <p className="text-sm text-muted">No pending challenges.</p>
          ) : (
            pending.map((c) => (
              <MealChallengeCard
                key={c.id}
                challenge={c}
                detailed
                actions={
                  <>
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => void approve(c)}
                      className="rounded-xl bg-simelabs px-4 py-2 text-xs font-semibold text-simelabs-foreground disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => void reject(c)}
                      className="rounded-xl border border-default px-4 py-2 text-xs font-medium disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                }
              />
            ))
          ))}

        {section === 'live' &&
          (live.length === 0 ? (
            <p className="text-sm text-muted">No live meal bets right now.</p>
          ) : (
            live.map((c) => (
              <MealChallengeCard key={c.id} challenge={c} detailed />
            ))
          ))}

        {section === 'settle' &&
          (readyToSettle.length === 0 ? (
            <p className="text-sm text-muted">No finished matches awaiting settlement.</p>
          ) : (
            readyToSettle.map((c) => (
              <MealChallengeCard
                key={c.id}
                challenge={c}
                detailed
                actions={
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    onClick={() => void settle(c)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Settle meal &amp; points
                  </button>
                }
              />
            ))
          ))}
      </div>
    </div>
  )
}
