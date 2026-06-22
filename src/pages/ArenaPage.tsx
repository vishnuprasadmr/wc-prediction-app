import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useSeasonQuestionnaire } from '../hooks/useSeasonQuestionnaire'
import { useArenaHero } from '../hooks/useArenaHero'
import {
  createShootoutChallenge,
  respondShootoutChallenge,
  useShootoutChallenges,
  type ShootoutChallengeView,
} from '../hooks/useShootoutChallenges'
import { HeroPickerSheet } from '../components/shootout/HeroPickerSheet'
import { PracticeShootout } from '../components/shootout/PracticeShootout'
import { ShootoutGameScreen } from '../components/shootout/ShootoutGameScreen'
import { LeaderboardAvatar } from '../components/LeaderboardAvatar'
import { heroLabel } from '../lib/shootout/hero'
import { SHOOTOUT_TAUNTS } from '../lib/shootout/types'
import { SupportingTeamFlag } from '../components/SupportingTeamFlag'

export function ArenaPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const opponentParam = searchParams.get('opponent')

  const { row: seasonRow } = useSeasonQuestionnaire()
  const heartTeam = seasonRow?.answers?.heart_team ?? null

  const { hero, saveHero, ensureDefault } = useArenaHero(user?.id, heartTeam)
  const {
    loading,
    error,
    refetch,
    pendingIncoming,
    pendingOutgoing,
    active,
    myTurn,
    recentCompleted,
  } = useShootoutChallenges(user?.id)

  const { entries } = useLeaderboard('all', 'global')

  const [heroOpen, setHeroOpen] = useState(false)
  const [practiceOpen, setPracticeOpen] = useState(false)
  const [activeGameId, setActiveGameId] = useState<string | null>(null)
  const [challengeOpponentId, setChallengeOpponentId] = useState(opponentParam ?? '')
  const [taunt, setTaunt] = useState<string>(SHOOTOUT_TAUNTS[0])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const challengablePlayers = useMemo(
    () => entries.filter((e) => e.user_id !== user?.id),
    [entries, user?.id],
  )

  const activeChallenge = useMemo(
    () => active.find((c) => c.id === activeGameId) ?? myTurn[0] ?? null,
    [active, activeGameId, myTurn],
  )

  useEffect(() => {
    if (opponentParam) setChallengeOpponentId(opponentParam)
  }, [opponentParam])

  useEffect(() => {
    if (myTurn.length > 0 && !activeGameId) {
      setActiveGameId(myTurn[0].id)
    }
  }, [myTurn, activeGameId])

  useEffect(() => {
    if (user?.id && heartTeam && !hero) {
      void ensureDefault()
    }
  }, [user?.id, heartTeam, hero, ensureDefault])

  const sendChallenge = async () => {
    if (!challengeOpponentId) return
    setBusy(true)
    setMessage(null)
    if (!hero && heartTeam) await ensureDefault()
    const result = await createShootoutChallenge(challengeOpponentId, taunt)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setMessage('Challenge sent!')
    setSearchParams({})
    await refetch()
  }

  const respond = async (c: ShootoutChallengeView, accept: boolean) => {
    setBusy(true)
    const result = await respondShootoutChallenge(c.id, accept)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    if (accept) {
      setActiveGameId(c.id)
      setMessage('Fight on! Take your dive.')
    }
    await refetch()
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-card to-card p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 text-8xl opacity-20">⚽</div>
        <p className="type-overline text-emerald-400">Arena</p>
        <h1 className="type-page-title mt-1">Penalty shootout</h1>
        <p className="type-caption mt-2 max-w-md text-pretty text-muted">
          Challenge a rival, pick your squad hero, and win the shootout. Glory only — no league points.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Arena unavailable — apply migration 029 in Supabase. ({error})
        </p>
      )}

      {message && <p className="text-sm text-simelabs">{message}</p>}

      <section className="rounded-2xl border border-default bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="type-overline">Your hero</p>
            <p className="mt-1 font-semibold text-theme">{hero ? heroLabel(hero) : 'Not chosen'}</p>
            {heartTeam && <SupportingTeamFlag team={heartTeam} variant="inline" />}
          </div>
          <button
            type="button"
            onClick={() => setHeroOpen(true)}
            className="rounded-xl border border-default px-4 py-2 text-sm font-medium"
          >
            {hero ? 'Change' : 'Pick hero'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setPracticeOpen(true)}
          className="mt-4 w-full rounded-xl bg-emerald-600/20 py-3 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30"
        >
          Practice vs moving keeper
        </button>
      </section>

      {myTurn.length > 0 && (
        <section className="rounded-2xl border border-simelabs/40 bg-simelabs/10 p-4">
          <p className="font-bold text-simelabs">Your turn!</p>
          <p className="mt-1 text-sm text-muted">{myTurn.length} active duel(s) need you.</p>
          <button
            type="button"
            onClick={() => setActiveGameId(myTurn[0].id)}
            className="mt-3 w-full rounded-xl bg-simelabs py-3 text-sm font-semibold text-simelabs-foreground"
          >
            Enter the Arena
          </button>
        </section>
      )}

      {pendingIncoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="type-section-title">Challenge incoming</h2>
          {pendingIncoming.map((c) => (
            <ChallengeRow key={c.id} challenge={c} selfId={user?.id}>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void respond(c, true)}
                  className="flex-1 rounded-xl bg-simelabs py-2 text-xs font-semibold text-simelabs-foreground"
                >
                  Accept fight
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void respond(c, false)}
                  className="flex-1 rounded-xl border border-default py-2 text-xs font-medium"
                >
                  Decline
                </button>
              </div>
            </ChallengeRow>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-default bg-card p-4">
        <h2 className="type-section-title">Challenge a player</h2>
        <select
          value={challengeOpponentId}
          onChange={(e) => setChallengeOpponentId(e.target.value)}
          className="mt-3 w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none"
        >
          <option value="">Select rival…</option>
          {challengablePlayers.map((p) => (
            <option key={p.user_id} value={p.user_id}>
              #{p.rank} {p.display_name}
            </option>
          ))}
        </select>
        <select
          value={taunt}
          onChange={(e) => setTaunt(e.target.value)}
          className="mt-2 w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none"
        >
          {SHOOTOUT_TAUNTS.map((t) => (
            <option key={t} value={t}>
              Taunt: {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || !challengeOpponentId || loading}
          onClick={() => void sendChallenge()}
          className="mt-3 w-full rounded-xl bg-[#E23744] py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send challenge
        </button>
      </section>

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="type-section-title">Live duels</h2>
          {active.map((c) => (
            <ChallengeRow key={c.id} challenge={c} selfId={user?.id}>
              <button
                type="button"
                onClick={() => setActiveGameId(c.id)}
                className="mt-3 w-full rounded-xl border border-default py-2 text-xs font-semibold"
              >
                {c.turn_user_id === user?.id ? 'Play your turn' : 'View duel'}
              </button>
            </ChallengeRow>
          ))}
        </section>
      )}

      {pendingOutgoing.length > 0 && (
        <section className="space-y-2">
          <h2 className="type-section-title text-muted">Waiting for response</h2>
          {pendingOutgoing.map((c) => (
            <ChallengeRow key={c.id} challenge={c} selfId={user?.id} />
          ))}
        </section>
      )}

      {recentCompleted.length > 0 && (
        <section className="space-y-2">
          <h2 className="type-section-title">Recent results</h2>
          {recentCompleted.map((c) => (
            <motion.div
              key={c.id}
              layout
              className="rounded-xl border border-default bg-muted/20 px-4 py-3 text-sm"
            >
              <p className="font-semibold">
                {c.challenger_name} {c.challenger_score}–{c.opponent_score} {c.opponent_name}
              </p>
              <p className="text-xs text-muted">
                Winner: {c.winner_name ?? '—'}
              </p>
            </motion.div>
          ))}
        </section>
      )}

      <HeroPickerSheet
        open={heroOpen}
        heartTeam={heartTeam}
        currentHero={hero}
        onClose={() => setHeroOpen(false)}
        onSave={async (h) => {
          await saveHero(h)
        }}
      />

      <PracticeShootout
        open={practiceOpen}
        heroName={hero?.name}
        onClose={() => setPracticeOpen(false)}
      />

      {activeChallenge && (
        <ShootoutGameScreen
          challenge={activeChallenge}
          open={Boolean(activeGameId)}
          onClose={() => setActiveGameId(null)}
          onComplete={() => void refetch()}
        />
      )}
    </div>
  )
}

function ChallengeRow({
  challenge: c,
  selfId,
  children,
}: {
  challenge: ShootoutChallengeView
  selfId?: string
  children?: ReactNode
}) {
  const isChallenger = c.challenger_id === selfId
  const rivalName = isChallenger ? c.opponent_name : c.challenger_name
  const rivalAvatar = isChallenger ? c.opponent_avatar : c.challenger_avatar

  return (
    <div className="rounded-xl border border-default bg-card p-4">
      <div className="flex items-center gap-3">
        <LeaderboardAvatar name={rivalName} avatarUrl={rivalAvatar} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-theme">vs {rivalName}</p>
          <p className="text-xs text-muted capitalize">{c.status.replace('_', ' ')}</p>
          {c.status === 'active' && (
            <p className="text-xs tabular-nums text-simelabs">
              {c.challenger_score}–{c.opponent_score} · kick {c.kick_number}
            </p>
          )}
          {c.taunt_text && <p className="mt-1 text-xs italic text-muted">“{c.taunt_text}”</p>}
        </div>
      </div>
      {children}
    </div>
  )
}
