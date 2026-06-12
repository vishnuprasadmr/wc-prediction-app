import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface GloryEntry {
  display_name: string
  home_team: string
  away_team: string
  home_pred: number
  away_pred: number
  home_score: number
  away_score: number
}

export function GloryWall() {
  const [entries, setEntries] = useState<GloryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('glory_opt_in', true)

      if (!profiles?.length) {
        setLoading(false)
        return
      }

      const ids = profiles.map((p) => p.id)
      const nameMap = Object.fromEntries(profiles.map((p) => [p.id, p.display_name]))

      const { data: preds } = await supabase
        .from('predictions')
        .select('user_id, home_pred, away_pred, points_earned, match:matches(home_team, away_team, home_score, away_score, status)')
        .in('user_id', ids)
        .eq('points_earned', 0)

      const bold: GloryEntry[] = []
      for (const row of preds ?? []) {
        const m = row.match as unknown as {
          home_team: string
          away_team: string
          home_score: number | null
          away_score: number | null
          status: string
        } | null
        if (!m || m.status !== 'finished') continue
        const totalPred = row.home_pred + row.away_pred
        if (totalPred < 4) continue
        bold.push({
          display_name: nameMap[row.user_id] ?? 'Player',
          home_team: m.home_team,
          away_team: m.away_team,
          home_pred: row.home_pred,
          away_pred: row.away_pred,
          home_score: m.home_score ?? 0,
          away_score: m.away_score ?? 0,
        })
      }

      setEntries(bold.slice(0, 5))
      setLoading(false)
    })()
  }, [])

  if (loading) return null
  if (entries.length === 0) return null

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
      <h3 className="type-section-title">Glory / shame wall</h3>
      <p className="type-caption mt-1 text-muted">Bold picks that missed (opt-in only)</p>
      <ul className="mt-3 space-y-2">
        {entries.map((e, i) => (
          <li key={i} className="rounded-xl bg-card/80 p-3 text-sm">
            <p className="font-medium">{e.display_name}</p>
            <p className="text-xs text-muted">
              {e.home_team} vs {e.away_team} — picked {e.home_pred}-{e.away_pred}, got{' '}
              {e.home_score}-{e.away_score}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
