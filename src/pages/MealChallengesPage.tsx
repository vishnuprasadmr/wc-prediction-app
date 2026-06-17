import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from '../hooks/useMatches'
import {
  cancelMealChallenge,
  createMealChallenge,
  useMealChallenges,
} from '../hooks/useMealChallenges'
import {
  backedOutcomeOptions,
  MEAL_CHALLENGE_STAKE_EXAMPLES,
  MEAL_CHALLENGE_WIN_OPTIONS,
  type MealChallengeWinCondition,
  type MealClaimOutcome,
} from '../lib/mealChallenges'
import { getActionableMatches } from '../lib/matchUtils'
import { formatKickoffIst } from '../lib/timezone'
import { MealChallengeAcceptPanel } from '../components/MealChallengeAcceptPanel'
import { MealChallengeCard } from '../components/MealChallengeCard'
import { ZOMATO_GIFT_CARD_TAGLINE } from '../lib/prizes'
import { markAllMealBetsSeen } from '../lib/mealBetNotifications'

type Tab = 'live' | 'mine' | 'settled'

export function MealChallengesPage() {
  const { user, profile } = useAuth()
  const { matches } = useMatches()
  const { challenges, loading, error, live, settled, refetch } = useMealChallenges(matches)
  const [tab, setTab] = useState<Tab>('live')
  const [matchId, setMatchId] = useState('')
  const [backedOutcome, setBackedOutcome] = useState<MealClaimOutcome>('home_win')
  const [claim, setClaim] = useState('')
  const [stake, setStake] = useState('')
  const [winCondition, setWinCondition] = useState<MealChallengeWinCondition>('exact_score')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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

  const myChallenges = useMemo(
    () => (user?.id ? challenges.filter((c) => c.creator_id === user.id) : []),
    [challenges, user?.id],
  )

  const visible = tab === 'live' ? live : tab === 'mine' ? myChallenges : settled

  useEffect(() => {
    markAllMealBetsSeen(live.map((c) => c.id))
  }, [live])

  const submit = async () => {
    if (!user?.id || !matchId || !claim.trim() || !stake.trim()) {
      setMessage('Pick a match and fill in both lines.')
      return
    }

    setSubmitting(true)
    setMessage(null)
    const result = await createMealChallenge({
      match_id: matchId,
      creator_id: user.id,
      claim_text: claim,
      stake_text: stake,
      backed_outcome: backedOutcome,
      win_condition: winCondition,
    })
    setSubmitting(false)

    if (!result.ok) {
      setMessage(result.message)
      return
    }

    setClaim('')
    setStake('')
    setMessage('Sent for admin approval — it goes live once approved.')
    setTab('mine')
    void refetch()
  }

  const useExample = (example: string) => setStake(example)

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#E23744]/30 bg-gradient-to-br from-[#E23744]/10 via-card to-simelabs/5 p-5"
      >
        <p className="type-overline text-[#E23744]">Meal challenges</p>
        <h1 className="type-page-title mt-1">Predict &amp; earn meals</h1>
        <p className="type-body-sm mt-2 text-pretty text-muted">
          Call your shot on a match — wrong call means you buy a meal for whoever nails the
          prediction. Others can <span className="font-medium text-theme">accept your bet</span>{' '}
          and stake league points: if your claim comes true, they lose points to you. Admin approves
          every challenge before it goes live.
        </p>
        <p className="type-caption mt-2 text-muted">{ZOMATO_GIFT_CARD_TAGLINE}</p>
      </motion.div>

      <div className="rounded-2xl border border-default bg-card p-4">
        <h2 className="type-section-title">Propose a challenge</h2>
        <p className="type-caption mt-1 text-muted">
          Example: “Portugal win today” — or “Chicken mandi for the exact score predictor”
        </p>

        <div className="mt-4 space-y-3">
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
      </div>

      <div className="flex gap-2">
        {(
          [
            ['live', `Live (${live.length})`],
            ['mine', `Mine (${myChallenges.length})`],
            ['settled', `Settled (${settled.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === key ? 'bg-simelabs text-simelabs-foreground' : 'bg-muted text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}. Run migrations <code className="text-xs">021</code> and{' '}
          <code className="text-xs">022</code>.
        </p>
      )}

      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-default bg-card p-8 text-center text-sm text-muted">
          {tab === 'live'
            ? 'No live meal challenges yet — be the first to propose one.'
            : tab === 'mine'
              ? 'You have not proposed any challenges yet.'
              : 'No settled challenges yet.'}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <MealChallengeCard
              key={c.id}
              challenge={c}
              showCreator={tab !== 'mine'}
              actions={
                <>
                  {tab === 'live' && user?.id && c.status === 'approved' && (
                    <MealChallengeAcceptPanel
                      challenge={c}
                      userId={user.id}
                      onAccepted={() => void refetch()}
                    />
                  )}
                  {tab === 'mine' && c.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => void cancelMealChallenge(c.id).then(() => refetch())}
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
      )}

      {!profile?.is_admin && (
        <p className="type-caption text-center text-muted">
          Challenges are moderated. Meals &amp; Zomato treats for food stakes — league points for
          accepted bets.
        </p>
      )}
    </div>
  )
}
