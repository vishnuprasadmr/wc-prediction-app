import { useMemo, useState } from 'react'
import { TeamFlag } from '../components/TeamFlag'
import { useMatches } from '../hooks/useMatches'
import { formatStageLabel, statusLabel } from '../lib/matchUtils'
import { formatKickoffTimeIst, toIstDateKey, formatIstDateHeader } from '../lib/timezone'
import type { Match, MatchStage } from '../lib/types'

type ResultsFilter = 'all' | 'live' | 'finished' | MatchStage

const stageFilters: { key: ResultsFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'finished', label: 'Finished' },
  { key: 'Group', label: 'Groups' },
  { key: 'Round of 32', label: 'R32' },
  { key: 'Round of 16', label: 'R16' },
  { key: 'Quarter-final', label: 'QF' },
  { key: 'Semi-final', label: 'SF' },
  { key: 'Final', label: 'Final' },
]

function scoreCell(match: Match): string {
  if (match.status === 'live' || match.status === 'finished') {
    if (match.home_score !== null && match.away_score !== null) {
      return `${match.home_score} – ${match.away_score}`
    }
  }
  return '–'
}

export function ResultsPage() {
  const { matches, loading } = useMatches()
  const [filter, setFilter] = useState<ResultsFilter>('all')

  const filtered = useMemo(() => {
    let list = matches
    if (filter === 'live') list = matches.filter((m) => m.status === 'live')
    else if (filter === 'finished') list = matches.filter((m) => m.status === 'finished')
    else if (filter !== 'all') list = matches.filter((m) => m.stage === filter)
    return [...list].sort(
      (a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
    )
  }, [matches, filter])

  const grouped = useMemo(() => {
    const map: Record<string, Match[]> = {}
    for (const match of filtered) {
      const key = toIstDateKey(match.kickoff_at)
      if (!map[key]) map[key] = []
      map[key].push(match)
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  return (
    <div className="space-y-4">
      <div>
        <p className="type-overline !text-[10px]">Tournament</p>
        <h2 className="type-section-title">Results</h2>
        <p className="type-caption mt-1 text-muted">Scores and stages · newest first</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {stageFilters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
              filter === key
                ? 'bg-simelabs text-simelabs-foreground'
                : 'bg-muted text-muted hover:text-theme'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-default bg-card p-6 text-center text-sm text-muted">
          No matches for this filter yet.
        </div>
      )}

      {!loading &&
        grouped.map(([dateKey, dayMatches]) => (
          <section key={dateKey}>
            <h3 className="type-overline mb-2 px-1 !text-[10px]">
              {formatIstDateHeader(dateKey)}
            </h3>
            <div className="overflow-hidden rounded-2xl border border-default bg-card shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[340px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-default bg-muted/40 text-[10px] uppercase tracking-wide text-muted">
                      <th className="px-3 py-2 font-semibold">Time</th>
                      <th className="px-2 py-2 font-semibold">Stage</th>
                      <th className="px-2 py-2 font-semibold">Home</th>
                      <th className="px-2 py-2 text-center font-semibold">Score</th>
                      <th className="px-3 py-2 font-semibold">Away</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayMatches.map((match) => {
                      const live = match.status === 'live'
                      const ft = match.status === 'finished'
                      return (
                        <tr
                          key={match.id}
                          className={`border-b border-default/60 last:border-0 ${
                            live ? 'bg-red-500/5' : ft ? '' : 'opacity-80'
                          }`}
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                            {formatKickoffTimeIst(match.kickoff_at)}
                          </td>
                          <td className="px-2 py-2.5">
                            <span className="text-[10px] font-medium text-subtle">
                              {formatStageLabel(match.stage, match.group_name)}
                            </span>
                            {live && (
                              <span className="ml-1 inline-flex rounded bg-red-500/15 px-1 py-0.5 text-[9px] font-bold text-red-400">
                                LIVE
                              </span>
                            )}
                            {ft && (
                              <span className="ml-1 text-[9px] font-semibold text-muted">
                                {statusLabel(match.status)}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <TeamFlag team={match.home_team} size="xs" />
                              <span className="max-w-[5.5rem] truncate font-medium">{match.home_team}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-center font-mono font-bold text-theme">
                            {scoreCell(match)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="max-w-[5.5rem] truncate text-right font-medium">
                                {match.away_team}
                              </span>
                              <TeamFlag team={match.away_team} size="xs" />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))}
    </div>
  )
}
