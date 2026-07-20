import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FinaleGiftModal } from '../components/FinaleGiftModal'
import { useAuth } from '../contexts/AuthContext'
import { useFinaleParty } from '../hooks/useFinaleParty'
import { useLeaguePrizes } from '../hooks/useLeaguePrizes'
import { awardDisplayTitle, type FinalePrizeAwardPublic } from '../lib/finaleParty'
import {
  formatInr,
  prizePoolShare,
  resolvePrizePoolTotal,
  sumPrizeAmounts,
  ZOMATO_GIFT_CARD_TAGLINE,
} from '../lib/prizes'

export function PrizesPage() {
  const { profile } = useAuth()
  const { config, prizes: allPrizes, loading } = useLeaguePrizes()
  const { config: finaleConfig, awards: finaleAwards, myAwards, refetch } = useFinaleParty()
  const [giftAward, setGiftAward] = useState<FinalePrizeAwardPublic | null>(null)
  const isAdmin = Boolean(profile?.is_admin)
  const prizes = allPrizes.filter((p) => !p.title.toLowerCase().includes('matchday'))
  const winnersPublished = finaleConfig?.status === 'published' && finaleAwards.length > 0
  const poolTotal = config ? resolvePrizePoolTotal(prizes, config.total_inr) : 0
  const rowTotal = sumPrizeAmounts(prizes)
  const awardCount = prizes.length

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="rounded-2xl border border-default bg-card p-8 text-center">
        <p className="text-4xl">🏆</p>
        <p className="mt-2 text-muted">Prize details are not set up yet.</p>
        {isAdmin && (
          <Link
            to="/admin"
            className="mt-4 inline-block text-sm font-semibold text-simelabs hover:underline"
          >
            Configure in Admin →
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!config.published && isAdmin && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm">
          <p className="font-semibold text-amber-300">Draft — only admins can see this</p>
          <p className="mt-1 text-muted">
            Players cannot see the Prizes page until you publish it in{' '}
            <Link to="/admin" className="font-medium text-simelabs hover:underline">
              Admin
            </Link>
            .
          </p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-simelabs/35 bg-gradient-to-br from-simelabs/15 via-card to-amber-400/5 p-6 text-center shadow-card"
      >
        <p className="type-overline text-simelabs">Overall prize pool</p>
        <h1 className="type-display mt-2">{config.headline}</h1>
        <p className="type-body-sm mx-auto mt-2 max-w-lg text-pretty text-muted">{config.intro}</p>

        <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-simelabs/30 bg-card/80 px-4 py-5">
          <p className="font-heading text-4xl font-black tabular-nums text-simelabs">
            {formatInr(poolTotal)}
          </p>
          <p className="mt-2 text-sm font-bold uppercase tracking-wide text-theme">
            Total pool — shared across all awards
          </p>
          <p className="type-caption mt-2 text-pretty text-muted">
            Not one winner-takes-all prize. The amounts below are separate Zomato e-gift cards that
            add up to this pool.
          </p>
        </div>

        <p className="type-caption mx-auto mt-4 max-w-md text-muted">
          {awardCount > 0
            ? `${awardCount} award categories · ${formatInr(rowTotal)} allocated · ${ZOMATO_GIFT_CARD_TAGLINE}`
            : ZOMATO_GIFT_CARD_TAGLINE}
        </p>
      </motion.div>

      <div className="rounded-xl border border-default bg-muted/30 px-4 py-3 text-sm text-muted">
        <p className="font-semibold text-theme">How to read this page</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-pretty">
          <li>
            <strong className="text-theme">{formatInr(poolTotal)}</strong> is the{' '}
            <strong className="text-theme">overall</strong> league pool for the whole tournament.
          </li>
          <li>
            Each row is an <strong className="text-theme">individual award</strong> (e.g. Champion
            gets {prizes[0] ? formatInr(prizes[0].amount_inr) : 'their share'}, not the full pool).
          </li>
          <li>All category values together equal the total pool — no extra cash on top.</li>
        </ul>
      </div>

      {myAwards.length > 0 && (
        <div className="rounded-2xl border border-simelabs/40 bg-simelabs/10 p-4">
          <p className="type-overline !text-simelabs">Your Zomato gift</p>
          <h2 className="type-section-title mt-1">View anytime</h2>
          <p className="type-caption mt-1 text-muted">
            Card number and PIN stay available whenever you need them.
          </p>
          <ul className="mt-3 space-y-2">
            {myAwards.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setGiftAward(a)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-simelabs/30 bg-card px-3 py-3 text-left text-sm transition hover:bg-simelabs/10"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{awardDisplayTitle(a)}</span>
                    <span className="text-muted">
                      {a.revealed_at ? 'Tap to view card & PIN' : 'Tap to unlock gift'}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-lg bg-simelabs px-3 py-1.5 text-xs font-bold text-simelabs-foreground">
                    {formatInr(a.amount_inr)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {winnersPublished && (
        <div className="rounded-2xl border border-simelabs/30 bg-simelabs/5 p-4">
          <p className="type-overline !text-simelabs">Winners announced</p>
          <h2 className="type-section-title mt-1">Who won what</h2>
          <ul className="mt-3 space-y-2">
            {finaleAwards.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-card/80 px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{awardDisplayTitle(a)}</span>
                  <span className="text-muted">{a.winner_display_name ?? '—'}</span>
                  {a.masked_card && (
                    <span className="mt-0.5 block font-mono text-xs text-simelabs">
                      Zomato {a.masked_card}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-bold tabular-nums text-simelabs">
                  {formatInr(a.amount_inr)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FinaleGiftModal
        award={giftAward}
        onClose={() => setGiftAward(null)}
        onRevealed={() => void refetch({ silent: true })}
      />

      <div>
        <h2 className="type-section-title">Prize breakdown</h2>
        <p className="type-caption mt-1 text-muted">
          Individual awards from the {formatInr(poolTotal)} pool
        </p>
      </div>

      <div className="space-y-3">
        {prizes.map((prize, i) => {
          const share = prizePoolShare(prize.amount_inr, poolTotal)
          const matchedWinners = winnersPublished
            ? finaleAwards.filter((a) => {
                const pt = prize.title.toLowerCase()
                const at = a.title.toLowerCase()
                if (pt.includes('season') && at.includes('season')) return true
                if (pt.includes('lucky') && at.includes('lucky')) return true
                return pt.includes(at) || at.includes(pt.split(' ')[0] ?? '')
              })
            : []
          return (
            <motion.div
              key={prize.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex gap-4 rounded-2xl border border-default bg-card p-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E23744]/15 text-xl">
                🍽️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Individual award
                    </p>
                    <h2 className="font-bold text-theme">{prize.title}</h2>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block font-heading text-xl font-extrabold tabular-nums text-simelabs">
                      {formatInr(prize.amount_inr)}
                    </span>
                    {share > 0 && (
                      <span className="text-[10px] font-medium text-muted">
                        {share}% of pool
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm font-semibold text-simelabs">{prize.winner_rule}</p>
                {prize.description && (
                  <p className="type-caption mt-1 text-pretty text-muted">{prize.description}</p>
                )}
                {matchedWinners.length > 0 && (
                  <p className="mt-2 text-sm font-medium text-theme">
                    Winner{matchedWinners.length > 1 ? 's' : ''}:{' '}
                    {matchedWinners
                      .map((w) =>
                        w.night_label
                          ? `${w.winner_display_name ?? '—'} (${w.night_label})`
                          : (w.winner_display_name ?? '—'),
                      )
                      .join(' · ')}
                  </p>
                )}
                {poolTotal > 0 && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-simelabs/80"
                      style={{ width: `${Math.max(share, 2)}%` }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {prizes.length > 0 && poolTotal > 0 && (
        <div className="rounded-xl border border-simelabs/25 bg-simelabs/5 px-4 py-3 text-center text-sm">
          <span className="text-muted">Categories total </span>
          <span className="font-bold tabular-nums text-simelabs">{formatInr(rowTotal)}</span>
          <span className="text-muted"> = overall pool </span>
          <span className="font-bold tabular-nums text-simelabs">{formatInr(poolTotal)}</span>
        </div>
      )}

      {config.footer_note && (
        <p className="type-caption text-center text-pretty text-muted">{config.footer_note}</p>
      )}

      {isAdmin && (
        <Link
          to="/admin"
          className="block rounded-xl border border-dashed border-simelabs/40 bg-simelabs/5 py-3 text-center text-sm font-semibold text-simelabs transition hover:bg-simelabs/10"
        >
          Edit prizes in Admin
        </Link>
      )}
    </div>
  )
}
