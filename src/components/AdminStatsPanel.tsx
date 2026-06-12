import { useEffect, useState } from 'react'
import { syncDueMatchScores } from '../lib/liveScoreSync'
import { supabase } from '../lib/supabase'

interface AdminStats {
  total_players: number
  with_employee_id: number
  questionnaire_done: number
  total_predictions: number
  finished_matches: number
  upcoming_in_24h: number
  players_with_predictions: number
}

export function AdminStatsPanel({ onSynced }: { onSynced?: () => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_admin_stats')
    if (!error && data) setStats(data as AdminStats)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      const result = await syncDueMatchScores()
      setMessage(
        result
          ? `Synced ${result.updated ?? 0} match(es).`
          : 'Sync complete.',
      )
      await load()
      onSynced?.()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed')
    }
    setSyncing(false)
  }

  if (loading && !stats) {
    return <div className="mb-4 h-24 animate-pulse rounded-2xl bg-card" />
  }

  if (!stats) return null

  const items = [
    { label: 'Players', value: stats.total_players },
    { label: 'Verified IDs', value: stats.with_employee_id },
    { label: 'Questionnaire', value: stats.questionnaire_done },
    { label: 'Predictions', value: stats.total_predictions },
    { label: 'Finished', value: stats.finished_matches },
    { label: 'Next 24h', value: stats.upcoming_in_24h },
    { label: 'Active pickers', value: stats.players_with_predictions },
  ]

  return (
    <div className="mb-6 rounded-2xl border border-default bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="type-section-title">League health</h3>
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={syncing}
          className="rounded-lg bg-simelabs px-3 py-1.5 text-xs font-semibold text-simelabs-foreground disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Sync FIFA scores'}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-simelabs">{message}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-muted/50 px-3 py-2 text-center">
            <p className="text-lg font-bold text-simelabs">{item.value}</p>
            <p className="type-caption">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
