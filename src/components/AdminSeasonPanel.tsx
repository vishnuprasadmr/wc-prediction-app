import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  SEASON_OFFICIAL_KEYS,
  SEASON_QUESTIONS,
  WC_TEAMS,
  GOLDEN_BOOT_CANDIDATES,
} from '../lib/seasonQuestions'

const KEY_LABELS: Record<string, string> = Object.fromEntries(
  SEASON_QUESTIONS.filter((q) => q.points > 0).map((q) => [q.key, q.title]),
)

export function AdminSeasonPanel() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('season_official_results').select('result_key, result_value')
      if (data) {
        const map: Record<string, string> = {}
        for (const row of data) {
          map[row.result_key] = row.result_value
        }
        setValues(map)
      }
      setLoading(false)
    })()
  }, [])

  const saveResults = async () => {
    setSaving(true)
    setMessage(null)
    const rows = SEASON_OFFICIAL_KEYS.map((key) => ({
      result_key: key,
      result_value: values[key]?.trim() ?? '',
    })).filter((r) => r.result_value)

    const { error } = await supabase.from('season_official_results').upsert(rows, {
      onConflict: 'result_key',
    })
    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }
    setMessage('Official results saved.')
    setSaving(false)
  }

  const settle = async () => {
    setSaving(true)
    setMessage(null)
    const { data, error } = await supabase.rpc('settle_season_predictions')
    if (error) {
      setMessage(error.message)
    } else {
      setMessage(`Season bonuses settled for ${data ?? 0} players.`)
    }
    setSaving(false)
  }

  if (loading) return null

  return (
    <div className="mb-6 rounded-2xl border border-simelabs/30 bg-simelabs/5 p-4">
      <h3 className="type-section-title">Season questionnaire settlement</h3>
      <p className="type-caption mt-1 text-pretty">
        Set official answers after the tournament, then settle bonus points on the leaderboard.
      </p>

      <div className="mt-4 space-y-3">
        {SEASON_OFFICIAL_KEYS.map((key) => (
          <div key={key}>
            <label className="type-caption mb-1 block font-medium">{KEY_LABELS[key] ?? key}</label>
            {key === 'golden_boot' ? (
              <input
                list="golden-boot-official"
                value={values[key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                className="input-field text-sm"
                placeholder="Player name"
              />
            ) : (
              <select
                value={values[key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                className="input-field text-sm"
              >
                <option value="">Select team…</option>
                {WC_TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
        <datalist id="golden-boot-official">
          {GOLDEN_BOOT_CANDIDATES.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      {message && (
        <p className="mt-3 text-sm text-simelabs" role="status">
          {message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void saveResults()}
          disabled={saving}
          className="rounded-xl border border-default bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
        >
          Save official results
        </button>
        <button
          type="button"
          onClick={() => void settle()}
          disabled={saving}
          className="rounded-xl bg-simelabs px-4 py-2 text-sm font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark disabled:opacity-50"
        >
          Settle season bonuses
        </button>
      </div>
    </div>
  )
}
