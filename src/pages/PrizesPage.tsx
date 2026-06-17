import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useLeaguePrizes } from '../hooks/useLeaguePrizes'
import { formatInr, sumPrizeAmounts, ZOMATO_GIFT_CARD_LABEL, ZOMATO_GIFT_CARD_TAGLINE } from '../lib/prizes'

export function PrizesPage() {
  const { profile } = useAuth()
  const { config, prizes, loading } = useLeaguePrizes()
  const isAdmin = Boolean(profile?.is_admin)
  const poolTotal = config ? sumPrizeAmounts(prizes) : 0

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
        <p className="type-overline text-simelabs">Tournament prizes</p>
        <h1 className="type-display mt-2">{config.headline}</h1>
        <p className="type-body-sm mx-auto mt-2 max-w-md text-pretty text-muted">{config.intro}</p>
        <p className="mt-4 font-heading text-4xl font-black text-simelabs">
          {formatInr(config.total_inr)}
        </p>
        <p className="mt-2 text-sm font-semibold text-theme">{ZOMATO_GIFT_CARD_LABEL}</p>
        <p className="type-caption mt-1 text-muted">{ZOMATO_GIFT_CARD_TAGLINE}</p>
        {poolTotal > 0 && poolTotal !== config.total_inr && (
          <p className="type-caption mt-1 text-muted">
            Prize rows total {formatInr(poolTotal)} — adjust in admin if needed
          </p>
        )}
      </motion.div>

      <div className="space-y-3">
        {prizes.map((prize, i) => (
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
                <h2 className="font-bold text-theme">{prize.title}</h2>
                <div className="shrink-0 text-right">
                  <span className="block font-heading text-xl font-extrabold text-simelabs">
                    {formatInr(prize.amount_inr)}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#E23744]">
                    {ZOMATO_GIFT_CARD_LABEL}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm font-semibold text-simelabs">{prize.winner_rule}</p>
              {prize.description && (
                <p className="type-caption mt-1 text-pretty text-muted">{prize.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

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
