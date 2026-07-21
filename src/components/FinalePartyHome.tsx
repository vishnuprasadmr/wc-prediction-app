import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useFinaleParty } from '../hooks/useFinaleParty'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useMatches } from '../hooks/useMatches'
import { resolveCachedAvatarUrl } from '../lib/avatarCache'
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
import { supabase } from '../lib/supabase'
import { FinaleGiftModal } from './FinaleGiftModal'
import { ProfileAvatar } from './ProfileAvatar'

type WinnerView = FinalePrizeAwardPublic & {
  winner_display_name: string
  winner_avatar_url: string | null
}

export function FinalePartyHome() {
  const { profile } = useAuth()
  const { matches } = useMatches()
  const { config, awards, myAwards, loading, refetch } = useFinaleParty()
  const { entries } = useLeaderboard()
  const [giftAward, setGiftAward] = useState<FinalePrizeAwardPublic | null>(null)
  const [profiles, setProfiles] = useState<
    Record<string, { display_name: string; avatar_url: string | null }>
  >({})

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
    const ids = [...new Set(awards.map((a) => a.user_id).filter(Boolean))] as string[]
    if (ids.length === 0) {
      setProfiles({})
      return
    }
    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', ids)
      const map: Record<string, { display_name: string; avatar_url: string | null }> = {}
      for (const p of data ?? []) {
        map[p.id as string] = {
          display_name: (p.display_name as string) || 'Winner',
          avatar_url: (p.avatar_url as string | null) ?? null,
        }
      }
      setProfiles(map)
      for (const p of Object.values(map)) {
        if (p.avatar_url) void resolveCachedAvatarUrl(p.avatar_url)
      }
    })()
  }, [awards])

  const winners = useMemo((): WinnerView[] => {
    return awards
      .filter((a) => a.user_id)
      .map((a) => {
        const p = a.user_id ? profiles[a.user_id] : undefined
        return {
          ...a,
          winner_display_name: a.winner_display_name?.trim() || p?.display_name || 'Winner',
          winner_avatar_url: a.winner_avatar_url ?? p?.avatar_url ?? null,
        }
      })
  }, [awards, profiles])

  const champion = winners.find((w) => w.slot_key === 'champion')
  const runnerUp = winners.find((w) => w.slot_key === 'runner_up')
  const bronze = winners.find((w) => w.slot_key === 'bronze')
  const luckyDraws = winners.filter((w) =>
    ['lucky_draw', 'lucky_draw_simelabs'].includes(String(w.slot_key)),
  )
  const otherSpecials = winners.filter(
    (w) =>
      !['champion', 'runner_up', 'bronze', 'lucky_draw', 'lucky_draw_simelabs'].includes(
        String(w.slot_key),
      ),
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

  // Initial load only — never tear down the party UI (or gift modal) on background refetch.
  if (loading && !config) {
    return <div className="mb-4 h-[70vh] animate-pulse rounded-none bg-muted/60 -mx-4" />
  }

  if (homeMode === 'anticipation') {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative -mx-4 mb-2 min-h-[72vh] overflow-hidden border-y border-simelabs/25 bg-[#061510] px-5 py-14 text-center text-white"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 55% at 50% 0%, rgb(38 203 153 / 0.35), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 90%, rgb(0 150 136 / 0.25), transparent 50%), linear-gradient(180deg, #061510 0%, #0a1f18 55%, #04100c 100%)',
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-simelabs/20 blur-3xl"
          animate={{ x: [0, 24, 0], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-10 bottom-16 h-48 w-48 rounded-full bg-teal-500/15 blur-3xl"
          animate={{ y: [0, -18, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto max-w-lg">
          <p className="font-heading text-sm font-extrabold tracking-[0.22em] text-simelabs uppercase">
            Simelabs WC 26
          </p>
          <h1 className="mt-4 font-heading text-4xl font-black tracking-tight text-balance sm:text-5xl">
            {config?.anticipation_headline ?? 'The Final whistle has blown'}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/70">
            {config?.anticipation_body ??
              'Official results and Zomato gifts drop once the host locks the envelope.'}
          </p>

          <motion.div
            className="mx-auto mt-10 h-28 w-20 rounded-md bg-gradient-to-b from-simelabs/40 to-simelabs/10 shadow-[0_20px_50px_rgb(38_203_153/0.25)] ring-1 ring-simelabs/40"
            animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/30" />
            <div className="mx-auto mt-8 h-8 w-8 rounded-full border border-simelabs/50 bg-simelabs/20" />
          </motion.div>

          <p className="mt-8 text-sm font-semibold text-simelabs">
            {formatInr(FINALE_POOL_TOTAL_INR)} prize pool · sealing the envelope
          </p>
          <Link
            to="/leaderboard"
            className="mt-8 inline-flex rounded-xl bg-simelabs px-5 py-3 text-sm font-bold text-simelabs-foreground"
          >
            View standings
          </Link>
        </div>
      </motion.section>
    )
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative -mx-4 mb-2 overflow-hidden border-y border-simelabs/20 bg-[#061510] text-white"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 90% 60% at 50% -10%, rgb(38 203 153 / 0.4), transparent 55%), radial-gradient(ellipse 50% 35% at 0% 70%, rgb(245 158 11 / 0.12), transparent 45%), linear-gradient(180deg, #04120e 0%, #0a1f18 40%, #061510 100%)',
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-simelabs/60 to-transparent"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        />

        <div className="relative px-5 pb-10 pt-10 sm:pt-12">
          <div className="mx-auto max-w-2xl text-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-sm font-extrabold tracking-[0.28em] text-simelabs uppercase"
            >
              Simelabs WC 26
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-3 font-heading text-4xl font-black tracking-tight text-balance sm:text-5xl"
            >
              {config?.published_headline ?? 'Tournament honours'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.16 }}
              className="mx-auto mt-3 max-w-md text-base leading-relaxed text-white/70"
            >
              {config?.published_body ??
                'The league is settled. Meet the winners — Zomato gifts unlocked in the app.'}
            </motion.p>
          </div>

          {myAwards.length > 0 && (
            <MyGiftPanel awards={myAwards} onOpen={(a) => setGiftAward(a)} />
          )}

          {champion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.22, type: 'spring', stiffness: 160, damping: 18 }}
              className="mx-auto mt-10 flex max-w-sm flex-col items-center text-center"
            >
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute -inset-4 rounded-full bg-simelabs/25 blur-2xl"
                />
                <ProfileAvatar
                  name={champion.winner_display_name}
                  avatarUrl={champion.winner_avatar_url}
                  size="hero"
                  className="ring-[3px] ring-simelabs/80 ring-offset-4 ring-offset-[#061510]"
                />
              </div>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">
                Champion
              </p>
              <p className="mt-1 font-heading text-3xl font-black tracking-tight">
                {champion.winner_display_name}
              </p>
              <p className="mt-1 text-lg font-semibold text-simelabs">
                {formatInr(champion.amount_inr)} Zomato
              </p>
              {champion.masked_card && (
                <p className="mt-2 font-mono text-xs tracking-wide text-white/55">
                  {champion.masked_card}
                </p>
              )}
            </motion.div>
          )}

          {(runnerUp || bronze) && (
            <div className="mx-auto mt-12 grid max-w-lg grid-cols-2 gap-6">
              {runnerUp && <PodiumWinner award={runnerUp} label="Runner-up" delay={0.3} />}
              {bronze && <PodiumWinner award={bronze} label="Bronze" delay={0.38} />}
            </div>
          )}

          {luckyDraws.length > 0 && (
            <div className="mx-auto mt-14 max-w-2xl">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300/80">
                Lucky draws
              </p>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                {luckyDraws.map((award, i) => (
                  <LuckyDrawWinner key={award.id} award={award} delay={0.4 + i * 0.08} />
                ))}
              </ul>
            </div>
          )}

          {otherSpecials.length > 0 && (
            <div className="mx-auto mt-14 max-w-2xl">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                Special prizes
              </p>
              <ul className="mt-6 grid gap-8 sm:grid-cols-2">
                {otherSpecials.map((award, i) => (
                  <motion.li
                    key={award.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="flex flex-col items-center text-center"
                  >
                    <ProfileAvatar
                      name={award.winner_display_name}
                      avatarUrl={award.winner_avatar_url}
                      size="xl"
                      className="ring-2 ring-white/20 ring-offset-2 ring-offset-[#061510]"
                    />
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-simelabs">
                      {awardDisplayTitle(award)}
                    </p>
                    <p className="mt-1 font-heading text-lg font-extrabold leading-tight">
                      {award.winner_display_name}
                    </p>
                    <p className="mt-0.5 text-sm text-white/60">{formatInr(award.amount_inr)}</p>
                    {award.masked_card && (
                      <p className="mt-1 font-mono text-[10px] text-white/40">{award.masked_card}</p>
                    )}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {winners.length > 0 && (
            <div className="mx-auto mt-16 max-w-2xl">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                Full winners board
              </p>
              <ul className="mt-5 space-y-3">
                {winners.map((award, i) => (
                  <motion.li
                    key={award.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.04 }}
                    className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-3 ring-1 ring-white/10"
                  >
                    <ProfileAvatar
                      name={award.winner_display_name}
                      avatarUrl={award.winner_avatar_url}
                      size="md"
                      className="ring-2 ring-simelabs/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-simelabs">
                        {awardDisplayTitle(award)}
                      </p>
                      <p className="truncate font-heading text-base font-extrabold">
                        {award.winner_display_name}
                        {award.user_id === profile?.id ? (
                          <span className="ml-2 text-xs font-bold text-amber-300">You</span>
                        ) : null}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-simelabs">
                      {formatInr(award.amount_inr)}
                    </p>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {homeMode === 'thanks' && (
            <ThanksStrip
              name={profile?.display_name ?? 'Player'}
              rank={me?.rank}
              points={me?.total_points}
              exacts={me?.exact_scores}
            />
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {myAwards[0] && (
              <button
                type="button"
                onClick={() => setGiftAward(myAwards[0]!)}
                className="rounded-xl bg-simelabs px-5 py-2.5 text-sm font-bold text-simelabs-foreground"
              >
                {myAwards[0].revealed_at ? 'View my Zomato gift' : 'Open my Zomato gift'}
              </button>
            )}
            <Link
              to="/leaderboard"
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              Full standings
            </Link>
          </div>
        </div>
      </motion.section>

      <FinaleGiftModal
        award={giftAward}
        onClose={() => setGiftAward(null)}
        onRevealed={() => {
          // Keep the open modal mounted; only refresh winner list labels in the background.
          void refetch({ silent: true })
        }}
      />
    </>
  )
}

function LuckyDrawWinner({ award, delay }: { award: WinnerView; delay: number }) {
  const label =
    award.slot_key === 'lucky_draw_simelabs' || award.night_label === 'Simelabs'
      ? 'Simelabs league'
      : 'Global league'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center rounded-2xl bg-gradient-to-b from-amber-400/15 to-transparent px-4 py-6 text-center ring-1 ring-amber-300/25"
    >
      <ProfileAvatar
        name={award.winner_display_name}
        avatarUrl={award.winner_avatar_url}
        size="xl"
        className="ring-2 ring-amber-300/70 ring-offset-2 ring-offset-[#061510]"
      />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
        Lucky draw · {label}
      </p>
      <p className="mt-1 font-heading text-xl font-extrabold leading-tight">
        {award.winner_display_name}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-simelabs">{formatInr(award.amount_inr)}</p>
      {award.masked_card && (
        <p className="mt-1 font-mono text-[10px] text-white/40">{award.masked_card}</p>
      )}
    </motion.div>
  )
}

function MyGiftPanel({
  awards,
  onOpen,
}: {
  awards: FinalePrizeAwardPublic[]
  onOpen: (award: FinalePrizeAwardPublic) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="mx-auto mt-8 w-full max-w-md rounded-2xl bg-simelabs/20 px-4 py-4 ring-1 ring-simelabs/50"
    >
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-simelabs">
        Your prize
      </p>
      <p className="mt-1 text-center text-sm text-white/70">
        Open anytime — card number and PIN stay here for you.
      </p>
      <ul className="mt-4 space-y-2">
        {awards.map((award) => (
          <li key={award.id}>
            <button
              type="button"
              onClick={() => onOpen(award)}
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#0a1f18] px-4 py-3 text-left ring-1 ring-simelabs/40 transition hover:bg-simelabs/15"
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-simelabs">
                  {award.revealed_at ? 'Tap to view again' : 'Tap to unlock'}
                </span>
                <span className="block font-heading text-base font-bold text-white">
                  {awardDisplayTitle(award)}
                </span>
                {award.masked_card && (
                  <span className="mt-0.5 block font-mono text-[11px] text-white/50">
                    {award.masked_card}
                  </span>
                )}
              </span>
              <span className="shrink-0 rounded-lg bg-simelabs px-3 py-1.5 text-xs font-bold text-simelabs-foreground">
                {formatInr(award.amount_inr)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function PodiumWinner({
  award,
  label,
  delay,
}: {
  award: WinnerView
  label: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center text-center"
    >
      <ProfileAvatar
        name={award.winner_display_name}
        avatarUrl={award.winner_avatar_url}
        size="xl"
        className="ring-2 ring-simelabs/50 ring-offset-2 ring-offset-[#061510]"
      />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl font-extrabold leading-tight">
        {award.winner_display_name}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-simelabs">
        {formatInr(award.amount_inr)}
      </p>
      {award.masked_card && (
        <p className="mt-1 font-mono text-[10px] text-white/40">{award.masked_card}</p>
      )}
    </motion.div>
  )
}

function ThanksStrip({
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
    <div className="mx-auto mt-12 max-w-md text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-simelabs">
        Thanks for playing
      </p>
      <p className="mt-2 font-heading text-2xl font-black">{name}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/60">
        You made this league matter. No Zomato card this round — the banter and Final night were
        the real prize.
      </p>
      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-white/40">Rank</dt>
          <dd className="font-heading text-xl font-black tabular-nums">
            {rank != null ? `#${rank}` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-white/40">Points</dt>
          <dd className="font-heading text-xl font-black tabular-nums">{points ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-white/40">Exacts</dt>
          <dd className="font-heading text-xl font-black tabular-nums">{exacts ?? '—'}</dd>
        </div>
      </dl>
    </div>
  )
}
