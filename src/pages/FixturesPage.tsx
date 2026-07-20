import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LiveScoreboard } from '../components/LiveScoreboard'
import { FinalePartyHome } from '../components/FinalePartyHome'
import { MealBetHomeSurprise } from '../components/MealBetHomeSurprise'
import { SeasonEditPollCard } from '../components/SeasonEditPollCard'
import { SeasonEditPollReveal } from '../components/SeasonEditPollReveal'
import { SeasonEditWindowBanner } from '../components/SeasonEditWindowBanner'
import { SoftErrorBoundary } from '../components/SoftErrorBoundary'
import { MatchCard } from '../components/MatchCard'
import { PredictionModal } from '../components/PredictionModal'
import { useGuardedPredict } from '../hooks/useGuardedPredict'
import { useNextMatchFocus } from '../hooks/useNextMatchFocus'
import { useMatches } from '../hooks/useMatches'
import { resolveFinaleHomePhase } from '../lib/finaleParty'
import { useFinaleParty } from '../hooks/useFinaleParty'
import {
  getActionableMatches,
  getMatchFilterStatus,
  getNextFocusMatch,
  getPredictableMatches,
  isMatchPredictable,
} from '../lib/matchUtils'
import { toIstDateKey, formatIstDateHeader } from '../lib/timezone'
import { notifyFirstPredictionBonus } from '../lib/engagementBonuses'
import type { Match } from '../lib/types'

type Filter = 'next' | 'upcoming' | 'live' | 'finished' | 'all'

const filters: { key: Filter; label: string }[] = [
  { key: 'next', label: 'Next' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'finished', label: 'Finished' },
  { key: 'all', label: 'All' },
]

export function FixturesPage() {
  const { matches, predictions, loading, error, liveScoreSyncing, refetch } = useMatches()
  const { config: finaleConfig } = useFinaleParty()
  const [filter, setFilter] = useState<Filter>('next')
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const finalePhase = resolveFinaleHomePhase(matches, finaleConfig)
  const showFinaleParty = finalePhase !== 'tournament'

  const openMatches = useMemo(() => getPredictableMatches(matches), [matches])
  const unpickedCount = useMemo(
    () => openMatches.filter((m) => !predictions[m.id]).length,
    [openMatches, predictions],
  )

  const focusMatch = useMemo(
    () => getNextFocusMatch(matches, predictions),
    [matches, predictions],
  )

  const needsPredictionFocus = useMemo(
    () => Boolean(focusMatch && isMatchPredictable(focusMatch) && !predictions[focusMatch.id]),
    [focusMatch, predictions],
  )

  const { spotlightActive, dismissSpotlight } = useNextMatchFocus({
    surface: 'fixtures',
    pathname: '/',
    loading,
    focusMatch: filter === 'next' ? focusMatch : null,
    scrollTargetId: 'fixture-match',
  })

  const guardedPredict = useGuardedPredict((m) => {
    dismissSpotlight()
    setSelectedMatch(m)
  })

  const filtered = useMemo(() => {
    if (filter === 'next') return getActionableMatches(matches)
    if (filter === 'all') return matches
    return matches.filter((m) => getMatchFilterStatus(m) === filter)
  }, [matches, filter])

  // Finished matches read best newest-first; everything else stays chronological.
  const newestFirst = filter === 'finished'

  const grouped = useMemo(() => {
    const groups: Record<string, Match[]> = {}
    for (const match of filtered) {
      const key = toIstDateKey(match.kickoff_at)
      if (!groups[key]) groups[key] = []
      groups[key].push(match)
    }
    const dir = newestFirst ? -1 : 1
    for (const key of Object.keys(groups)) {
      groups[key].sort(
        (a, b) =>
          dir * (new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()),
      )
    }
    return Object.entries(groups).sort(([a], [b]) =>
      newestFirst ? b.localeCompare(a) : a.localeCompare(b),
    )
  }, [filtered, newestFirst])

  // Incrementally reveal date sections so heavy MatchCards never render all at once.
  const PAGE_SIZE = 3
  const [visibleGroups, setVisibleGroups] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibleGroups(PAGE_SIZE)
  }, [filter])

  const visibleEntries = grouped.slice(0, visibleGroups)
  const hasMore = visibleGroups < grouped.length

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleGroups((count) => Math.min(count + PAGE_SIZE, grouped.length))
        }
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, grouped.length])

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <p className="mt-2 text-sm text-muted">Check your Supabase connection and env vars.</p>
      </div>
    )
  }

  // After the Final / prize release: home is the party board only — no live/next fixtures.
  if (showFinaleParty) {
    return (
      <div>
        <FinalePartyHome />
      </div>
    )
  }

  return (
    <div>
      <LiveScoreboard matches={matches} syncing={liveScoreSyncing} />
      <SoftErrorBoundary label="season-edit-poll-home">
        <SeasonEditPollReveal />
        <SeasonEditWindowBanner />
        <SeasonEditPollCard />
      </SoftErrorBoundary>
      <MealBetHomeSurprise />

      {unpickedCount > 0 && filter === 'next' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl border border-simelabs/30 bg-simelabs/8 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-simelabs">
                {unpickedCount} match{unpickedCount === 1 ? '' : 'es'} need picks
              </p>
              <p className="type-caption mt-1 leading-relaxed text-muted">
                Today &amp; tomorrow stay open all day in IST.
              </p>
            </div>
            <Link
              to="/predict"
              className="shrink-0 rounded-xl bg-simelabs px-4 py-2.5 text-center text-sm font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark"
            >
              Predict
            </Link>
          </div>
        </motion.div>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map(({ key, label }) => (
          <motion.button
            key={key}
            type="button"
            layout
            whileTap={{ scale: 0.96 }}
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === key
                ? 'bg-simelabs text-simelabs-foreground shadow-glow-sm'
                : 'bg-muted text-muted hover:text-theme'
            }`}
          >
            {label}
            {key === 'next' && unpickedCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-simelabs-foreground/20 px-1 text-[10px] font-bold">
                {unpickedCount}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {loading && matches.length === 0 ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-default bg-card p-8 text-center">
          <p className="text-4xl">⚽</p>
          <p className="mt-2 text-muted">No matches in this filter</p>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-3 text-sm font-medium text-simelabs hover:underline"
            >
              Show all matches
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {visibleEntries.map(([date, dayMatches]) => (
            <section key={date}>
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="type-section-title min-w-0">{formatIstDateHeader(date)}</h2>
                <span className="type-caption shrink-0 font-medium">IST</span>
              </div>
              <div className="space-y-2.5">
                {dayMatches.map((match, i) => {
                  const isFocus = focusMatch?.id === match.id
                  const showSpotlight =
                    filter === 'next' && spotlightActive && isFocus && needsPredictionFocus
                  const canPredict = isMatchPredictable(match)

                  return (
                    <div
                      key={match.id}
                      id={`fixture-match-${match.id}`}
                      className="scroll-mt-24"
                    >
                      {showSpotlight && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="type-overline mb-2 flex items-center gap-1.5 !text-[10px]"
                        >
                          <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-simelabs" />
                          Next up — pick this match
                        </motion.p>
                      )}
                      <MatchCard
                        match={match}
                        prediction={predictions[match.id]}
                        index={i}
                        showPoints
                        spotlight={showSpotlight}
                        onPredict={canPredict ? guardedPredict : undefined}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          {hasMore && (
            <div
              ref={sentinelRef}
              className="flex items-center justify-center py-6"
              aria-hidden
            >
              <span className="inline-flex items-center gap-2 text-sm text-muted">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-simelabs" />
                Loading more…
              </span>
            </div>
          )}
        </div>
      )}

      <PredictionModal
        match={selectedMatch}
        allMatches={matches}
        initialHome={selectedMatch ? predictions[selectedMatch.id]?.home_pred ?? 0 : 0}
        initialAway={selectedMatch ? predictions[selectedMatch.id]?.away_pred ?? 0 : 0}
        onClose={() => setSelectedMatch(null)}
        onSaved={(meta) => {
          if (meta?.firstPredictionBonus) notifyFirstPredictionBonus()
          dismissSpotlight()
          void refetch()
        }}
      />
    </div>
  )
}
