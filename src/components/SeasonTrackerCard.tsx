import { useEffect, useState } from 'react'
import { useMatches } from '../hooks/useMatches'
import { useSeasonQuestionnaire } from '../hooks/useSeasonQuestionnaire'
import { trackSeasonPicks } from '../lib/seasonTracker'
import { supabase } from '../lib/supabase'
import { TeamFlag } from './TeamFlag'

const STATUS_STYLE: Record<string, string> = {
  alive: 'text-emerald-600 bg-emerald-500/10',
  out: 'text-red-500 bg-red-500/10',
  pending: 'text-muted bg-muted',
  settled: 'text-simelabs bg-simelabs/15',
}

const STATUS_LABEL: Record<string, string> = {
  alive: 'Still in',
  out: 'Eliminated',
  pending: 'TBC',
  settled: 'Correct!',
}

export function SeasonTrackerCard() {
  const { matches } = useMatches()
  const { row, ready } = useSeasonQuestionnaire()
  const [officialWinner, setOfficialWinner] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('season_official_results')
        .select('result_value')
        .eq('result_key', 'world_cup_winner')
        .maybeSingle()
      setOfficialWinner(data?.result_value ?? null)
    })()
  }, [])

  if (!ready || !row?.answers) return null

  const picks = trackSeasonPicks(row.answers, matches, officialWinner)
  if (picks.length === 0) return null

  return (
    <div className="rounded-2xl border border-default bg-card p-4">
      <h3 className="type-section-title">Season pick tracker</h3>
      <p className="type-caption mt-1 text-muted">How your long-term picks are holding up</p>
      <ul className="mt-3 space-y-2">
        {picks.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <TeamFlag team={p.pick} emoji="" size="sm" />
              <div className="min-w-0">
                <p className="type-caption text-muted">{p.label}</p>
                <p className="truncate font-medium">{p.pick}</p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[p.status]}`}
            >
              {STATUS_LABEL[p.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
