import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMatches } from '../hooks/useMatches'
import { supabase } from '../lib/supabase'
import { formatKickoff } from '../lib/matchUtils'
import type { Match, MatchStatus } from '../lib/types'

export function AdminPage() {
  const { matches, loading, refetch } = useMatches()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Match | null>(null)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [status, setStatus] = useState<MatchStatus>('scheduled')
  const [manualOverride, setManualOverride] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const filtered = matches.filter(
    (m) =>
      m.home_team.toLowerCase().includes(search.toLowerCase()) ||
      m.away_team.toLowerCase().includes(search.toLowerCase()),
  )

  const openEdit = (match: Match) => {
    setEditing(match)
    setHomeScore(match.home_score ?? 0)
    setAwayScore(match.away_score ?? 0)
    setStatus(match.status)
    setManualOverride(match.manual_override)
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('matches')
      .update({
        home_score: status === 'scheduled' ? null : homeScore,
        away_score: status === 'scheduled' ? null : awayScore,
        status,
        score_source: manualOverride ? 'manual' : 'api',
        manual_override: manualOverride,
      })
      .eq('id', editing.id)

    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Match updated. Points recalculated.')
    setEditing(null)
    refetch()
  }

  const handleRecalcAll = async () => {
    setSaving(true)
    const { error } = await supabase.rpc('recalculate_all_points')
    setSaving(false)
    setMessage(error ? error.message : 'All points recalculated.')
    refetch()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Admin Panel</h2>
        <button
          onClick={handleRecalcAll}
          disabled={saving}
          className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium transition hover:opacity-80 disabled:opacity-50"
        >
          Recalc all points
        </button>
      </div>

      <input
        type="search"
        placeholder="Search teams..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-xl border border-default bg-card px-4 py-2.5 text-sm text-theme outline-none focus:border-simelabs"
      />

      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400"
        >
          {message}
        </motion.p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((match) => (
            <button
              key={match.id}
              onClick={() => openEdit(match)}
              className="flex w-full items-center justify-between rounded-xl bg-card p-4 text-left transition hover:bg-muted"
            >
              <div>
                <p className="text-sm font-medium">
                  {match.home_team} vs {match.away_team}
                </p>
                <p className="text-xs text-muted">{formatKickoff(match.kickoff_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">
                  {match.home_score ?? '-'} : {match.away_score ?? '-'}
                </p>
                <p className="text-xs text-muted">
                  {match.status}
                  {match.manual_override && ' · manual'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl bg-card p-6"
          >
            <h3 className="font-bold">
              {editing.home_team} vs {editing.away_team}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted">Home score</label>
                <input
                  type="number"
                  min={0}
                  value={homeScore}
                  onChange={(e) => setHomeScore(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg bg-card px-3 py-2 outline-none focus:ring-1 focus:ring-simelabs"
                />
              </div>
              <div>
                <label className="text-xs text-muted">Away score</label>
                <input
                  type="number"
                  min={0}
                  value={awayScore}
                  onChange={(e) => setAwayScore(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg bg-card px-3 py-2 outline-none focus:ring-1 focus:ring-simelabs"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs text-muted">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchStatus)}
                className="mt-1 w-full rounded-lg bg-card px-3 py-2 outline-none"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="finished">Finished</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>

            <label className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={manualOverride}
                onChange={(e) => setManualOverride(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Manual override (block API sync)</span>
            </label>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-xl border border-default py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-simelabs py-2.5 text-sm font-semibold text-simelabs-foreground disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
