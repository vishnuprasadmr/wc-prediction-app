import { useEffect, useState } from 'react'
import { useFinaleParty } from '../hooks/useFinaleParty'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { awardDisplayTitle } from '../lib/finaleParty'
import { formatInr } from '../lib/prizes'
import { SEASON_OFFICIAL_KEYS } from '../lib/seasonQuestions'
import { supabase } from '../lib/supabase'

export function SeasonAwardsCard() {
  const { entries } = useLeaderboard()
  const { config, awards, loading: finaleLoading } = useFinaleParty()
  const [seasonReady, setSeasonReady] = useState(false)

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('season_official_results').select('result_key, result_value')
      const filled = (data ?? []).filter((r) => r.result_value?.trim()).length
      setSeasonReady(filled >= SEASON_OFFICIAL_KEYS.length)
    })()
  }, [])

  if (config?.status === 'published' && awards.length > 0) {
    return (
      <div className="rounded-2xl border border-simelabs/30 bg-gradient-to-b from-simelabs/10 to-card p-4 text-center">
        <p className="type-overline !text-simelabs">Season awards</p>
        <h3 className="type-section-title mt-1">Tournament honours</h3>
        <div className="mt-4 space-y-3">
          {awards.map((a) => (
            <div key={a.id} className="rounded-xl bg-card/80 px-4 py-3">
              <p className="text-2xl">🏆</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-simelabs">
                {awardDisplayTitle(a)}
              </p>
              <p className="mt-1 font-bold">{a.winner_display_name ?? '—'}</p>
              <p className="text-xs text-muted">{formatInr(a.amount_inr)} Zomato gift</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (finaleLoading || !seasonReady || entries.length === 0) return null

  const champion = entries[0]
  const mostExact = [...entries].sort((a, b) => b.exact_scores - a.exact_scores)[0]
  const mostActive = [...entries].sort((a, b) => b.predictions_made - a.predictions_made)[0]

  const preview = [
    { title: 'Champion', name: champion.display_name, detail: `${champion.total_points} pts` },
    {
      title: 'Oracle',
      name: mostExact.display_name,
      detail: `${mostExact.exact_scores} exact scores`,
    },
    {
      title: 'Most active',
      name: mostActive.display_name,
      detail: `${mostActive.predictions_made} predictions`,
    },
  ]

  return (
    <div className="rounded-2xl border border-simelabs/30 bg-gradient-to-b from-simelabs/10 to-card p-4 text-center">
      <p className="type-overline !text-simelabs">Season awards</p>
      <h3 className="type-section-title mt-1">Tournament honours</h3>
      <p className="type-caption mt-1 text-muted">Unofficial until the host publishes finale gifts</p>
      <div className="mt-4 space-y-3">
        {preview.map((a) => (
          <div key={a.title} className="rounded-xl bg-card/80 px-4 py-3">
            <p className="text-2xl">🏆</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-simelabs">{a.title}</p>
            <p className="mt-1 font-bold">{a.name}</p>
            <p className="text-xs text-muted">{a.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
