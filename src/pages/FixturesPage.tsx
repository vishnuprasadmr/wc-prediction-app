import { useMemo, useState } from 'react'
import { LiveScoreboard } from '../components/LiveScoreboard'
import { MatchCard } from '../components/MatchCard'
import { useMatches } from '../hooks/useMatches'
import { getMatchFilterStatus } from '../lib/matchUtils'
import { toIstDateKey, formatIstDateHeader } from '../lib/timezone'
import type { Match } from '../lib/types'

type Filter = 'all' | 'upcoming' | 'live' | 'finished'

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'live', label: 'Live' },
  { key: 'finished', label: 'Finished' },
]

export function FixturesPage() {
  const { matches, predictions, loading, error, liveScoreSyncing } = useMatches()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return matches
    return matches.filter((m) => getMatchFilterStatus(m) === filter)
  }, [matches, filter])

  const grouped = useMemo(() => {
    const groups: Record<string, Match[]> = {}
    for (const match of filtered) {
      const key = toIstDateKey(match.kickoff_at)
      if (!groups[key]) groups[key] = []
      groups[key].push(match)
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort(
        (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
      )
    }
    return groups
  }, [filtered])

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <p className="mt-2 text-sm text-muted">Check your Supabase connection and env vars.</p>
      </div>
    )
  }

  return (
    <div>
      <LiveScoreboard matches={matches} syncing={liveScoreSyncing} />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === key
                ? 'bg-simelabs text-simelabs-foreground'
                : 'bg-muted text-muted hover:text-theme'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-default bg-card p-8 text-center">
          <p className="text-4xl">⚽</p>
          <p className="mt-2 text-muted">No matches in this filter</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayMatches]) => (
            <section key={date}>
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="type-section-title min-w-0">{formatIstDateHeader(date)}</h2>
                <span className="type-caption shrink-0 font-medium">IST</span>
              </div>
              <div className="space-y-2.5">
                {dayMatches.map((match, i) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predictions[match.id]}
                    index={i}
                    showPoints
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
