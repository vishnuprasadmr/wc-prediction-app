import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useFinaleParty } from '../hooks/useFinaleParty'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useMatches } from '../hooks/useMatches'
import { fireCelebration } from '../lib/confetti'
import {
  awardDisplayTitle,
  finaleCelebrateStorageKey,
  FINALE_POOL_TOTAL_INR,
  playerFinaleHomeMode,
  resolveFinaleHomePhase,
  type FinalePrizeAwardPublic,
} from '../lib/finaleParty'
import { formatInr } from '../lib/prizes'
import { playSound, primeAudio } from '../lib/sounds'
import { FinaleGiftModal } from './FinaleGiftModal'

interface FinalePartyHomeProps {
  onBrowseFinished: () => void
}

export function FinalePartyHome({ onBrowseFinished }: FinalePartyHomeProps) {
  const { profile } = useAuth()
  const { matches } = useMatches()
  const { config, awards, myAwards, loading, refetch } = useFinaleParty()
  const { entries } = useLeaderboard()
  const [giftAward, setGiftAward] = useState<FinalePrizeAwardPublic | null>(null)

  const phase = resolveFinaleHomePhase(matches, config)
  const homeMode = useMemo(
    () => playerFinaleHomeMode(phase, profile?.id, awards),
    [phase, profile?.id, awards],
  )
  const me = useMemo(
    () => entries.find((e) => e.user_id === profile?.id) ?? null,
    [entries, profile?.id],
  )

  useEffect(() => {
    if (phase !== 'anticipation' || loading) return
    try {
      const key = 'wc-finale-anticipation-tease'
      if (sessionStorage.getItem(key) === '1') return
      sessionStorage.setItem(key, '1')
      primeAudio()
      playSound('partyTease')
    } catch {
      /* ignore */
    }
  }, [phase, loading])

  useEffect(() => {
    if (phase !== 'published' || !config?.published_at || loading) return
    try {
      const key = finaleCelebrateStorageKey(config.published_at)
      if (localStorage.getItem(key) === '1') return
      localStorage.setItem(key, '1')
      primeAudio()
      playSound('finaleParty')
      fireCelebration('podium')
    } catch {
      /* ignore */
    }
  }, [phase, config?.published_at, loading])

  if (homeMode === 'hidden') return null

  // Wait for config/awards so winners don't flash the thanks card before gifts load.
  if (loading) {
    return <div className="mb-4 h-48 animate-pulse rounded-2xl bg-card" />
  }

  if (homeMode === 'anticipation') {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 overflow-hidden rounded-3xl border border-simelabs/35 bg-gradient-to-br from-simelabs/20 via-card to-amber-500/10 px-5 py-10 text-center"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgb(34 197 94 / 0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgb(245 158 11 / 0.25), transparent 40%)',
          }}
          animate={{ opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <p className="type-overline relative !text-simelabs">After-game party</p>
        <h1 className="type-display relative mt-2 text-balance">
          {config?.anticipation_headline ?? 'The Final whistle has blown'}
        </h1>
        <p className="type-body-sm relative mx-auto mt-3 max-w-md text-pretty text-muted">
          {config?.anticipation_body ??
            'Official results and Zomato gifts drop once the host locks the envelope.'}
        </p>
        <motion.div
          className="relative mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-card/80 text-3xl ring-1 ring-simelabs/30"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          ✉️
        </motion.div>
        <p className="relative mt-4 text-sm font-semibold text-simelabs">
          {formatInr(FINALE_POOL_TOTAL_INR)} prize pool · envelope sealing…
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onBrowseFinished}
            className="rounded-xl bg-simelabs px-4 py-2.5 text-sm font-semibold text-simelabs-foreground"
          >
            Browse finished matches
          </button>
          <Link
            to="/leaderboard"
            className="rounded-xl border border-default bg-card/80 px-4 py-2.5 text-sm font-semibold"
          >
            Standings
          </Link>
        </div>
      </motion.section>
    )
  }

  // published
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 overflow-hidden rounded-3xl border border-simelabs/40 bg-gradient-to-br from-simelabs/25 via-card to-amber-400/10 px-5 py-8 text-center"
      >
        <p className="type-overline !text-simelabs">Tournament complete</p>
        <h1 className="type-display mt-2 text-balance">
          {config?.published_headline ?? 'After-game party'}
        </h1>
        <p className="type-body-sm mx-auto mt-3 max-w-md text-pretty text-muted">
          {config?.published_body ??
            'Tournament honours are in. Open your gift if you won — everyone gets a thank-you.'}
        </p>

        {homeMode === 'gift' ? (
          <div className="mx-auto mt-6 max-w-sm space-y-3 text-left">
            {myAwards.map((award) => (
              <button
                key={award.id}
                type="button"
                onClick={() => setGiftAward(award)}
                className="flex w-full items-center gap-3 rounded-2xl border border-simelabs/40 bg-card/90 px-4 py-3 text-left transition hover:bg-simelabs/10"
              >
                <span className="text-3xl" aria-hidden>
                  {award.revealed_at ? '🎉' : '🎁'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold uppercase tracking-wide text-simelabs">
                    {award.revealed_at ? 'Gift opened' : 'You won — open your gift'}
                  </span>
                  <span className="block font-bold text-theme">
                    {awardDisplayTitle(award)}
                  </span>
                  <span className="text-sm text-muted">{formatInr(award.amount_inr)}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <ThanksCard
            name={profile?.display_name ?? 'Player'}
            rank={me?.rank}
            points={me?.total_points}
            exacts={me?.exact_scores}
          />
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onBrowseFinished}
            className="rounded-xl border border-default bg-card/80 px-4 py-2.5 text-sm font-semibold"
          >
            Finished matches
          </button>
          <Link
            to="/leaderboard"
            className="rounded-xl bg-simelabs px-4 py-2.5 text-sm font-semibold text-simelabs-foreground"
          >
            Full standings
          </Link>
        </div>
      </motion.section>

      {awards.length > 0 && (
        <div className="mb-6 rounded-2xl border border-default bg-card p-4">
          <p className="type-overline !text-simelabs">Tournament honours</p>
          <h2 className="type-section-title mt-1">Prize winners</h2>
          <ul className="mt-3 space-y-2">
            {awards.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-theme">
                    {awardDisplayTitle(a)}
                  </span>
                  <span className="text-muted">
                    {a.winner_display_name ?? '—'} · {formatInr(a.amount_inr)}
                  </span>
                </span>
                {a.user_id === profile?.id && (
                  <span className="shrink-0 text-[10px] font-bold uppercase text-simelabs">
                    You
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <FinaleGiftModal
        award={giftAward}
        onClose={() => setGiftAward(null)}
        onRevealed={() => void refetch()}
      />
    </>
  )
}

function ThanksCard({
  name,
  rank,
  points,
  exacts,
}: {
  name: string
  rank?: number
  points?: number
  exacts?: number
}) {
  return (
    <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-simelabs/30 bg-card/90 px-4 py-5 text-left">
      <p className="text-xs font-bold uppercase tracking-wide text-simelabs">Thanks for playing</p>
      <p className="mt-1 text-lg font-bold text-theme">{name}</p>
      <p className="type-caption mt-2 text-pretty text-muted">
        You made this league matter. No Zomato card this time — but the banter, picks, and Final
        night were the real prize.
      </p>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted/50 px-2 py-2">
          <dt className="text-[10px] uppercase text-muted">Rank</dt>
          <dd className="font-heading text-lg font-black tabular-nums">
            {rank != null ? `#${rank}` : '—'}
          </dd>
        </div>
        <div className="rounded-xl bg-muted/50 px-2 py-2">
          <dt className="text-[10px] uppercase text-muted">Points</dt>
          <dd className="font-heading text-lg font-black tabular-nums">{points ?? '—'}</dd>
        </div>
        <div className="rounded-xl bg-muted/50 px-2 py-2">
          <dt className="text-[10px] uppercase text-muted">Exacts</dt>
          <dd className="font-heading text-lg font-black tabular-nums">{exacts ?? '—'}</dd>
        </div>
      </dl>
    </div>
  )
}
