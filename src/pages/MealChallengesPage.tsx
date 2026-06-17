import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from '../hooks/useMatches'
import {
  cancelMealChallenge,
  createMealChallenge,
  useMealChallenges,
  type MealChallengeView,
} from '../hooks/useMealChallenges'
import {
  backedOutcomeOptions,
  MEAL_CHALLENGE_STAKE_EXAMPLES,
  MEAL_CHALLENGE_WIN_OPTIONS,
  type MealChallengeWinCondition,
  type MealClaimOutcome,
} from '../lib/mealChallenges'
import { getActionableMatches, isMatchLocked } from '../lib/matchUtils'
import { formatKickoffIst } from '../lib/timezone'
import { canAcceptMealBet } from '../lib/mealChallenges'
import { MealChallengeAcceptPanel } from '../components/MealChallengeAcceptPanel'
import { MealChallengeCard } from '../components/MealChallengeCard'
import { ZOMATO_GIFT_CARD_TAGLINE } from '../lib/prizes'
import { markAllMealBetsSeen } from '../lib/mealBetNotifications'

function ChallengeList({
  items,
  empty,
  userId,
  showCreator,
  showAccept,
  showCancel,
  detailed,
  currentUserId,
  onRefetch,
}: {
  items: MealChallengeView[]
  empty: string
  userId?: string
  showCreator?: boolean
  showAccept?: boolean
  showCancel?: boolean
  detailed?: boolean
  currentUserId?: string
  onRefetch: () => void
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-default bg-card/50 px-4 py-6 text-center text-sm text-muted">
        {empty}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <MealChallengeCard
          key={c.id}
          challenge={c}
          detailed={detailed}
          showCreator={showCreator}
          currentUserId={currentUserId ?? userId}
          onFulfillmentPosted={onRefetch}
          actions={
            <>
              {showAccept &&
                userId &&
                c.status === 'approved' &&
                canAcceptMealBet(c.match) && (
                <MealChallengeAcceptPanel
                  challenge={c}
                  userId={userId}
                  onAccepted={onRefetch}
                />
              )}
              {showCancel && c.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => void cancelMealChallenge(c.id).then(onRefetch)}
                  className="rounded-lg border border-default px-3 py-1.5 text-xs font-medium text-muted"
                >
                  Cancel request
                </button>
              )}
            </>
          }
        />
      ))}
    </div>
  )
}

export function MealChallengesPage() {
  const { user, profile } = useAuth()
  const { matches } = useMatches()
  const { challenges, loading, error, live, settled, refetch } = useMealChallenges(matches)
  const [matchId, setMatchId] = useState('')
  const [backedOutcome, setBackedOutcome] = useState<MealClaimOutcome>('home_win')
  const [claim, setClaim] = useState('')
  const [stake, setStake] = useState('')
  const [winCondition, setWinCondition] = useState<MealChallengeWinCondition>('exact_score')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showPropose, setShowPropose] = useState(false)

  const openMatches = useMemo(() => getActionableMatches(matches), [matches])
  const selectedMatch = useMemo(
    () => openMatches.find((m) => m.id === matchId),
    [openMatches, matchId],
  )
  const outcomeOptions = useMemo(
    () => (selectedMatch ? backedOutcomeOptions(selectedMatch) : []),
    [selectedMatch],
  )

  useEffect(() => {
    if (outcomeOptions.length > 0 && !outcomeOptions.some((o) => o.value === backedOutcome)) {
      setBackedOutcome(outcomeOptions[0].value)
    }
  }, [outcomeOptions, backedOutcome])

  const liveOpen = useMemo(
    () => live.filter((c) => canAcceptMealBet(c.match)),
    [live],
  )
  const liveLocked = useMemo(
    () => live.filter((c) => c.match && isMatchLocked(c.match)),
    [live],
  )

  const myPending = useMemo(
    () => (user?.id ? challenges.filter((c) => c.creator_id === user.id && c.status === 'pending') : []),
    [challenges, user?.id],
  )

  useEffect(() => {
    markAllMealBetsSeen(live.map((c) => c.id))
  }, [live])

  const handleRefetch = () => {
    void refetch()
  }

  const submit = async () => {
    if (!user?.id || !matchId || !claim.trim() || !stake.trim()) {
      setMessage('Pick a match and fill in both lines.')
      return
    }

    if (!selectedMatch || !canAcceptMealBet(selectedMatch)) {
      setMessage('This match is locked — pick an open fixture.')
      return
    }

    setSubmitting(true)
    setMessage(null)
    const result = await createMealChallenge(
      {
        match_id: matchId,
        creator_id: user.id,
        claim_text: claim,
        stake_text: stake,
        backed_outcome: backedOutcome,
        win_condition: winCondition,
      },
      selectedMatch,
    )
    setSubmitting(false)

    if (!result.ok) {
      setMessage(result.message)
      return
    }

    setClaim('')
    setStake('')
    setMessage('Sent for admin approval — it goes live once approved.')
    setShowPropose(false)
    handleRefetch()
  }

  const useExample = (example: string) => setStake(example)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#E23744]/30 bg-gradient-to-br from-[#E23744]/10 via-card to-simelabs/5 p-5"
      >
        <p className="type-overline text-[#E23744]">Meal challenges</p>
        <h1 className="type-page-title mt-1">Predict &amp; earn meals</h1>
        <p className="type-body-sm mt-2 text-pretty text-muted">
          Stake league points on live bets below. Wrong call on a meal challenge means you buy
          dinner — acceptors bet against the creator&apos;s claim.
        </p>
        <p className="type-caption mt-2 text-muted">{ZOMATO_GIFT_CARD_TAGLINE}</p>
      </motion.div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}. Run migrations <code className="text-xs">021</code>–<code className="text-xs">027</code>.
        </p>
      )}

      {/* Live bets — top priority */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h2 className="type-section-title">Live bets</h2>
            <p className="type-caption mt-0.5 text-muted">
              Accept &amp; stake points before predictions lock
            </p>
          </div>
          {liveOpen.length > 0 && (
            <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-300">
              {liveOpen.length} open
            </span>
          )}
        </div>

        {loading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <ChallengeList
            items={liveOpen}
            empty="No open meal bets — locked or finished matches move below once kickoff nears."
            userId={user?.id}
            currentUserId={user?.id}
            showAccept
            detailed
            onRefetch={handleRefetch}
          />
        )}
      </section>

      {liveLocked.length > 0 && (
        <section>
          <div className="mb-3">
            <h2 className="type-section-title">Locked — in play</h2>
            <p className="type-caption mt-0.5 text-muted">
              Predictions closed — no new point bets; waiting for full time
            </p>
          </div>
          <ChallengeList
            items={liveLocked}
            empty=""
            userId={user?.id}
            showCreator
            detailed
            onRefetch={handleRefetch}
          />
        </section>
      )}

      {/* Pending proposals */}
      {myPending.length > 0 && (
        <section>
          <h2 className="type-section-title mb-3">Your pending proposals</h2>
          <ChallengeList
            items={myPending}
            empty=""
            showCreator={false}
            showCancel
            onRefetch={handleRefetch}
          />
        </section>
      )}

      {/* Settled results — below live */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h2 className="type-section-title">Results</h2>
            <p className="type-caption mt-0.5 text-muted">Settled meal bets &amp; point outcomes</p>
          </div>
          {settled.length > 0 && (
            <span className="shrink-0 text-xs font-medium text-muted">{settled.length} settled</span>
          )}
        </div>

        {loading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <ChallengeList
            items={settled}
            empty="No settled challenges yet."
            showCreator
            detailed
            currentUserId={user?.id}
            onRefetch={handleRefetch}
          />
        )}
      </section>

      {/* Propose — bottom */}
      <section className="rounded-2xl border border-default bg-card p-4">
        <button
          type="button"
          onClick={() => setShowPropose((open) => !open)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div>
            <h2 className="type-section-title">Propose a challenge</h2>
            <p className="type-caption mt-0.5 text-muted">
              {showPropose
                ? 'Admin approves before it goes live'
                : 'Call your shot — tap to open the form'}
            </p>
          </div>
          <span className="shrink-0 text-lg text-muted" aria-hidden>
            {showPropose ? '−' : '+'}
          </span>
        </button>

        {showPropose && (
          <div className="mt-4 space-y-3 border-t border-default pt-4">
            <label className="block">
              <span className="type-caption mb-1 block font-medium">Match</span>
              <select
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none"
              >
                <option value="">Select a match…</option>
                {openMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.home_team} vs {m.away_team} · {formatKickoffIst(m.kickoff_at)}
                  </option>
                ))}
              </select>
            </label>

            {selectedMatch && (
              <label className="block">
                <span className="type-caption mb-1 block font-medium">Your claim (for point bets)</span>
                <select
                  value={backedOutcome}
                  onChange={(e) => setBackedOutcome(e.target.value as MealClaimOutcome)}
                  className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none"
                >
                  {outcomeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="type-caption mb-1 block font-medium">Your call (shown to everyone)</span>
              <input
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="Portugal will win today"
                className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none"
                maxLength={160}
              />
            </label>

            <label className="block">
              <span className="type-caption mb-1 block font-medium">Meal stake (if you&apos;re wrong)</span>
              <input
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Chicken mandi for whoever gets the exact score"
                className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none"
                maxLength={200}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MEAL_CHALLENGE_STAKE_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => useExample(ex)}
                    className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted hover:text-theme"
                  >
                    {ex.length > 40 ? `${ex.slice(0, 40)}…` : ex}
                  </button>
                ))}
              </div>
            </label>

            <label className="block">
              <span className="type-caption mb-1 block font-medium">Who wins the meal?</span>
              <select
                value={winCondition}
                onChange={(e) => setWinCondition(e.target.value as MealChallengeWinCondition)}
                className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none"
              >
                {MEAL_CHALLENGE_WIN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} — {o.hint}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="w-full rounded-xl bg-simelabs py-3 text-sm font-semibold text-simelabs-foreground disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit for admin approval'}
            </button>
            {message && <p className="text-center text-sm text-simelabs">{message}</p>}
          </div>
        )}
      </section>

      {!profile?.is_admin && (
        <p className="type-caption text-center text-muted">
          Challenges are moderated. Meals &amp; Zomato treats for food stakes — league points for
          accepted bets.
        </p>
      )}
    </div>
  )
}
