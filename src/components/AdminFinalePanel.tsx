import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFinaleParty } from '../hooks/useFinaleParty'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useMatches } from '../hooks/useMatches'
import {
  awardsReadyToPublish,
  buildFinaleSuggestions,
  FINALE_POOL_TOTAL_INR,
  FINALE_SLOT_DEFS,
  isFinalMatchFinished,
  type FinalePrizeAwardAdmin,
  type FinaleSlotKey,
} from '../lib/finaleParty'
import { formatInr } from '../lib/prizes'
import { SEASON_OFFICIAL_KEYS } from '../lib/seasonQuestions'
import { supabase } from '../lib/supabase'
import { AdminPrizeWinnerShare } from './AdminPrizeWinnerShare'

type DraftAward = FinalePrizeAwardAdmin

export function AdminFinalePanel() {
  const { matches } = useMatches()
  const { entries } = useLeaderboard()
  const { config, adminAwards, loading, error, refetch } = useFinaleParty({ admin: true })

  const [drafts, setDrafts] = useState<DraftAward[]>([])
  const [players, setPlayers] = useState<{ user_id: string; display_name: string }[]>([])
  const [seasonFilled, setSeasonFilled] = useState(0)
  const [seasonSettledCount, setSeasonSettledCount] = useState(0)
  const [luckyEligible, setLuckyEligible] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [pubHeadline, setPubHeadline] = useState('')
  const [pubBody, setPubBody] = useState('')

  const finalFinished = isFinalMatchFinished(matches)
  const published = config?.status === 'published'

  useEffect(() => {
    if (!config) return
    setHeadline(config.anticipation_headline)
    setBody(config.anticipation_body)
    setPubHeadline(config.published_headline)
    setPubBody(config.published_body)
  }, [config])

  useEffect(() => {
    const allowed = new Set(FINALE_SLOT_DEFS.map((d) => d.slot_key))
    setDrafts(
      adminAwards
        .filter((a) => allowed.has(a.slot_key as FinaleSlotKey))
        .map((a) => ({ ...a, zomato_code: a.zomato_code ?? '' })),
    )
  }, [adminAwards])

  useEffect(() => {
    void (async () => {
      const [{ data: profiles }, { data: seasonOfficial }, { data: seasonPreds }, { data: predRows }] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id, display_name, is_admin')
            .eq('is_admin', false)
            .order('display_name'),
          supabase.from('season_official_results').select('result_key, result_value'),
          supabase.from('season_predictions').select('user_id, points_earned'),
          supabase.from('predictions').select('user_id'),
        ])

      setPlayers(
        (profiles ?? []).map((p) => ({
          user_id: p.id as string,
          display_name: (p.display_name as string) || 'Player',
        })),
      )

      const filled = (seasonOfficial ?? []).filter((r) =>
        String(r.result_value ?? '').trim(),
      ).length
      setSeasonFilled(filled)

      const settled = (seasonPreds ?? []).filter((r) => r.points_earned != null).length
      setSeasonSettledCount(settled)

      const counts = new Map<string, number>()
      for (const row of predRows ?? []) {
        const uid = row.user_id as string
        counts.set(uid, (counts.get(uid) ?? 0) + 1)
      }
      const predictionCounts = [...counts.entries()].map(([user_id, count]) => ({
        user_id,
        count,
      }))

      const suggestions = buildFinaleSuggestions(
        entries,
        (seasonPreds ?? []).map((r) => ({
          user_id: r.user_id as string,
          points_earned: r.points_earned as number | null,
        })),
        predictionCounts,
        matches.length,
      )
      setLuckyEligible(suggestions.luckyEligibleIds)
    })()
  }, [entries, matches.length])

  const nameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of players) map.set(p.user_id, p.display_name)
    for (const e of entries) map.set(e.user_id, e.display_name)
    return map
  }, [players, entries])

  const updateDraft = (index: number, patch: Partial<DraftAward>) => {
    setDrafts((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const refreshSuggestions = useCallback(async () => {
    setMessage(null)
    const [{ data: seasonPreds }, { data: predRows }] = await Promise.all([
      supabase.from('season_predictions').select('user_id, points_earned'),
      supabase.from('predictions').select('user_id'),
    ])
    const counts = new Map<string, number>()
    for (const row of predRows ?? []) {
      const uid = row.user_id as string
      counts.set(uid, (counts.get(uid) ?? 0) + 1)
    }
    const suggestions = buildFinaleSuggestions(
      entries,
      (seasonPreds ?? []).map((r) => ({
        user_id: r.user_id as string,
        points_earned: r.points_earned as number | null,
      })),
      [...counts.entries()].map(([user_id, count]) => ({ user_id, count })),
      matches.length,
    )
    setLuckyEligible(suggestions.luckyEligibleIds)

    setDrafts((prev) =>
      prev.map((row) => {
        const key = row.slot_key as FinaleSlotKey
        const suggested = suggestions.bySlot[key] ?? null
        return {
          ...row,
          suggested_user_id: suggested,
          user_id: row.user_id || suggested,
        }
      }),
    )
    setMessage('Suggestions refreshed. Review each slot before saving.')
  }, [entries, matches.length])

  const saveDrafts = async () => {
    setSaving(true)
    setMessage(null)

    const { error: configError } = await supabase
      .from('finale_party_config')
      .update({
        anticipation_headline: headline.trim(),
        anticipation_body: body.trim(),
        published_headline: pubHeadline.trim(),
        published_body: pubBody.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)

    if (configError) {
      setMessage(configError.message)
      setSaving(false)
      return
    }

    for (const row of drafts) {
      const def = FINALE_SLOT_DEFS.find((d) => d.slot_key === row.slot_key)
      const { error: rowError } = await supabase
        .from('finale_prize_awards')
        .update({
          user_id: row.user_id || null,
          zomato_code: row.zomato_code?.trim() || null,
          night_label: row.night_label?.trim() || null,
          suggested_user_id: row.suggested_user_id || null,
          amount_inr: def?.amount_inr ?? row.amount_inr,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)

      if (rowError) {
        setMessage(rowError.message)
        setSaving(false)
        return
      }
    }

    setMessage('Finale draft saved.')
    setSaving(false)
    void refetch()
  }

  const publish = async () => {
    if (!awardsReadyToPublish(drafts)) {
      setMessage('Assign a player and Zomato code for every prize slot before publishing.')
      return
    }
    if (seasonFilled < SEASON_OFFICIAL_KEYS.length) {
      const ok = window.confirm(
        'Season official answers are incomplete. Publish anyway?',
      )
      if (!ok) return
    }
    if (seasonSettledCount === 0) {
      const ok = window.confirm(
        'Season bonuses do not look settled yet. Publish anyway?',
      )
      if (!ok) return
    }

    setSaving(true)
    setMessage(null)

    // Persist assignments first
    for (const row of drafts) {
      const def = FINALE_SLOT_DEFS.find((d) => d.slot_key === row.slot_key)
      const { error: rowError } = await supabase
        .from('finale_prize_awards')
        .update({
          user_id: row.user_id || null,
          zomato_code: row.zomato_code?.trim() || null,
          night_label: row.night_label?.trim() || null,
          suggested_user_id: row.suggested_user_id || null,
          amount_inr: def?.amount_inr ?? row.amount_inr,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      if (rowError) {
        setMessage(rowError.message)
        setSaving(false)
        return
      }
    }

    const { error: pubError } = await supabase
      .from('finale_party_config')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        anticipation_headline: headline.trim(),
        anticipation_body: body.trim(),
        published_headline: pubHeadline.trim(),
        published_body: pubBody.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)

    if (pubError) {
      setMessage(pubError.message)
      setSaving(false)
      return
    }

    setMessage('Results published. Players will see the after-game party on Home.')
    setSaving(false)
    void refetch()
  }

  const copySummary = async () => {
    const lines = drafts.map((d) => {
      const name = d.user_id ? nameById.get(d.user_id) ?? d.user_id : '(unassigned)'
      const label = d.night_label ? `${d.title} (${d.night_label})` : d.title
      return `${label}: ${name} — ${formatInr(d.amount_inr)} — code: ${d.zomato_code?.trim() || '—'}${
        d.revealed_at ? ' (opened)' : ''
      }`
    })
    const text = [`Finale awards (${formatInr(FINALE_POOL_TOTAL_INR)} pool)`, ...lines].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setMessage('Assignment summary copied.')
    } catch {
      setMessage('Could not copy — select text manually if needed.')
    }
  }

  if (loading && !config) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />
  }

  if (error && !config) {
    return (
      <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm">
        <p className="font-semibold text-amber-300">Finale tables not ready</p>
        <p className="mt-1 text-muted">{error}</p>
        <p className="mt-2 text-muted">
          Apply migration <code className="text-theme">038_finale_party.sql</code> in Supabase,
          then refresh.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPrizeWinnerShare />

      <div className="rounded-2xl border border-simelabs/30 bg-simelabs/5 p-4">
        <h3 className="type-section-title">After-final party</h3>
        <p className="type-caption mt-1 text-pretty text-muted">
          Assign every prize winner, paste Zomato e-gift codes, then publish. Home shows
          anticipation after the Final, and the full party once you release.
        </p>
        <p className="mt-2 text-sm font-semibold text-simelabs">
          Pool {formatInr(FINALE_POOL_TOTAL_INR)} · {FINALE_SLOT_DEFS.length} gift slots
        </p>
      </div>

      <div className="rounded-2xl border border-default bg-card p-4">
        <h4 className="text-sm font-bold">Checklist</h4>
        <ul className="mt-3 space-y-2 text-sm">
          <CheckItem ok={finalFinished} label="Final match finished" />
          <CheckItem
            ok={seasonFilled >= SEASON_OFFICIAL_KEYS.length}
            label={`Season official answers (${seasonFilled}/${SEASON_OFFICIAL_KEYS.length})`}
          />
          <CheckItem
            ok={seasonSettledCount > 0}
            label={`Season bonuses settled (${seasonSettledCount} players with points)`}
          />
          <CheckItem ok={awardsReadyToPublish(drafts)} label="All winners + Zomato codes filled" />
          <CheckItem ok={published} label="Results published to players" />
        </ul>
        <p className="type-caption mt-3 text-muted">
          Season answers &amp; settle live in{' '}
          <span className="font-medium text-theme">Admin → Season</span> — switch to that tab
          above, then come back here to assign gifts.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-default bg-card p-4">
        <h4 className="text-sm font-bold">Home copy</h4>
        <label className="block text-xs text-muted">
          Anticipation headline
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs text-muted">
          Anticipation body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs text-muted">
          Published headline
          <input
            value={pubHeadline}
            onChange={(e) => setPubHeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs text-muted">
          Published body
          <textarea
            value={pubBody}
            onChange={(e) => setPubBody(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void refreshSuggestions()}
          className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold"
        >
          Refresh suggestions
        </button>
        <button
          type="button"
          onClick={() => void saveDrafts()}
          disabled={saving}
          className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => void copySummary()}
          className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold"
        >
          Copy summary
        </button>
        <button
          type="button"
          onClick={() => void publish()}
          disabled={saving || published}
          className="rounded-xl bg-simelabs px-3 py-2 text-sm font-semibold text-simelabs-foreground disabled:opacity-50"
        >
          {published ? 'Published' : 'Publish results'}
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400">{message}</p>
      )}

      {luckyEligible.length > 0 && (
        <p className="type-caption text-muted">
          Lucky-draw eligible (70%+ picks):{' '}
          {luckyEligible
            .map((id) => nameById.get(id) ?? id.slice(0, 6))
            .slice(0, 12)
            .join(', ')}
          {luckyEligible.length > 12 ? ` +${luckyEligible.length - 12} more` : ''}
        </p>
      )}

      <div className="space-y-4">
        {drafts.map((row, index) => {
          const def = FINALE_SLOT_DEFS.find((d) => d.slot_key === row.slot_key)
          const suggestedName = row.suggested_user_id
            ? nameById.get(row.suggested_user_id)
            : null
          const isLucky = row.slot_key === 'lucky_draw'
          const options =
            isLucky && luckyEligible.length > 0
              ? players.filter((p) => luckyEligible.includes(p.user_id))
              : players
          const amount = def?.amount_inr ?? row.amount_inr

          return (
            <div
              key={row.id}
              className="rounded-2xl border border-default bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{row.title}</p>
                  <p className="text-xs text-muted">
                    {formatInr(amount)} · {def?.suggestionHint ?? row.slot_key}
                  </p>
                </div>
                {row.revealed_at && (
                  <span className="rounded-full bg-simelabs/15 px-2 py-0.5 text-[10px] font-bold uppercase text-simelabs">
                    Gift opened
                  </span>
                )}
              </div>

              {suggestedName && (
                <button
                  type="button"
                  onClick={() =>
                    updateDraft(index, {
                      user_id: row.suggested_user_id,
                    })
                  }
                  className="mt-3 rounded-lg border border-simelabs/40 bg-simelabs/10 px-3 py-1.5 text-xs font-semibold text-simelabs"
                >
                  Use suggestion: {suggestedName}
                </button>
              )}

              <label className="mt-3 block text-xs text-muted">
                Winner
                <select
                  value={row.user_id ?? ''}
                  onChange={(e) => updateDraft(index, { user_id: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select player…</option>
                  {(options.length ? options : players).map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.display_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-3 block text-xs text-muted">
                Zomato e-gift code
                <input
                  value={row.zomato_code ?? ''}
                  onChange={(e) => updateDraft(index, { zomato_code: e.target.value })}
                  placeholder="Paste card / voucher code"
                  className="mt-1 w-full rounded-lg border border-default bg-background px-3 py-2 font-mono text-sm"
                  autoComplete="off"
                />
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
          ok ? 'bg-simelabs/20 text-simelabs' : 'bg-muted text-muted'
        }`}
      >
        {ok ? '✓' : '·'}
      </span>
      <span className={ok ? 'text-theme' : 'text-muted'}>{label}</span>
    </li>
  )
}
