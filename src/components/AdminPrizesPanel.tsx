import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { LeaguePrize, LeaguePrizeConfig } from '../lib/prizes'
import {
  formatInr,
  resolvePrizePoolTotal,
  sumPrizeAmounts,
  ZOMATO_GIFT_CARD_TAGLINE,
} from '../lib/prizes'
import { useLeaguePrizes } from '../hooks/useLeaguePrizes'

type PrizeDraft = Omit<LeaguePrize, 'id'> & { id?: string }

function emptyPrize(sortOrder: number): PrizeDraft {
  return {
    sort_order: sortOrder,
    title: '',
    amount_inr: 0,
    winner_rule: '',
    description: '',
  }
}

export function AdminPrizesPanel() {
  const { config, prizes, loading, refetch, error } = useLeaguePrizes()
  const [published, setPublished] = useState(false)
  const [headline, setHeadline] = useState('')
  const [intro, setIntro] = useState('')
  const [totalInr, setTotalInr] = useState(5000)
  const [footerNote, setFooterNote] = useState('')
  const [rows, setRows] = useState<PrizeDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!config) return
    setPublished(config.published)
    setHeadline(config.headline)
    setIntro(config.intro)
    setTotalInr(config.total_inr)
    setFooterNote(config.footer_note)
  }, [config])

  useEffect(() => {
    setRows(
      prizes.map((p) => ({
        id: p.id,
        sort_order: p.sort_order,
        title: p.title,
        amount_inr: p.amount_inr,
        winner_rule: p.winner_rule,
        description: p.description ?? '',
      })),
    )
  }, [prizes])

  const rowTotal = sumPrizeAmounts(rows)
  const poolTotal = resolvePrizePoolTotal(rows, totalInr)
  const totalMismatch = rowTotal > 0 && rowTotal !== totalInr

  const updateRow = (index: number, patch: Partial<PrizeDraft>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const moveRow = (index: number, dir: -1 | 1) => {
    const next = index + dir
    if (next < 0 || next >= rows.length) return
    setRows((prev) => {
      const copy = [...prev]
      const a = copy[index]!
      const b = copy[next]!
      copy[index] = b
      copy[next] = a
      return copy.map((row, i) => ({ ...row, sort_order: i + 1 }))
    })
  }

  const removeRow = (index: number) => {
    setRows((prev) =>
      prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, sort_order: i + 1 })),
    )
  }

  const addRow = () => {
    setRows((prev) => [...prev, emptyPrize(prev.length + 1)])
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)

    const syncedTotal = rowTotal > 0 ? rowTotal : totalInr

    const configPayload: LeaguePrizeConfig = {
      published,
      headline: headline.trim() || 'Tournament prize pool',
      intro: intro.trim(),
      total_inr: syncedTotal,
      footer_note: footerNote.trim(),
    }

    const { error: configError } = await supabase
      .from('league_prize_config')
      .upsert({ id: true, ...configPayload, updated_at: new Date().toISOString() })

    if (configError) {
      setMessage(configError.message)
      setSaving(false)
      return
    }

    const validRows = rows.filter((r) => r.title.trim() && r.winner_rule.trim())
    const existingIds = validRows.map((r) => r.id).filter(Boolean) as string[]

    if (prizes.length > 0) {
      const toDelete = prizes.filter((p) => !existingIds.includes(p.id)).map((p) => p.id)
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase.from('league_prizes').delete().in('id', toDelete)
        if (deleteError) {
          setMessage(deleteError.message)
          setSaving(false)
          return
        }
      }
    }

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]!
      const payload = {
        sort_order: i + 1,
        title: row.title.trim(),
        amount_inr: Math.max(0, Number(row.amount_inr) || 0),
        winner_rule: row.winner_rule.trim(),
        description: row.description?.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (row.id) {
        const { error } = await supabase.from('league_prizes').update(payload).eq('id', row.id)
        if (error) {
          setMessage(error.message)
          setSaving(false)
          return
        }
      } else {
        const { error } = await supabase.from('league_prizes').insert(payload)
        if (error) {
          setMessage(error.message)
          setSaving(false)
          return
        }
      }
    }

    setMessage(published ? 'Prizes saved and visible to players.' : 'Prizes saved (still hidden from players).')
    setSaving(false)
    void refetch()
  }

  if (loading) {
    return <div className="mb-6 h-40 animate-pulse rounded-2xl bg-muted" />
  }

  if (error) {
    return (
      <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        Could not load prizes: {error}. Run migration <code className="text-xs">018_league_prizes.sql</code>.
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="type-section-title">Zomato gift cards</h3>
          <p className="type-caption mt-1 text-pretty">
            {ZOMATO_GIFT_CARD_TAGLINE}. Hidden from players until you publish.{' '}
            <Link to="/prizes" className="font-medium text-simelabs hover:underline">
              Preview page →
            </Link>
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-default bg-card px-3 py-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-simelabs"
          />
          <span className="text-sm font-semibold">
            {published ? 'Published' : 'Hidden from players'}
          </span>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="type-caption mb-1 block font-medium">Headline</span>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none ring-simelabs/40 focus:ring-2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="type-caption mb-1 block font-medium">Intro</span>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none ring-simelabs/40 focus:ring-2"
          />
        </label>
        <div className="rounded-lg bg-muted/60 px-3 py-3 sm:col-span-2">
          <p className="type-caption font-medium text-muted">Total prize pool (from rows)</p>
          <p className="mt-1 font-heading text-2xl font-black tabular-nums text-simelabs">
            {formatInr(poolTotal)}
          </p>
          <p className="type-caption mt-1 text-muted">
            Paid as Zomato e-gift cards · rows must add up to this total
          </p>
          {totalMismatch && (
            <p className="mt-2 text-xs font-medium text-amber-400">
              Manual total {formatInr(totalInr)} differs from rows {formatInr(rowTotal)} — saving
              will sync to {formatInr(rowTotal)}.
            </p>
          )}
        </div>
        <label className="block sm:col-span-2">
          <span className="type-caption mb-1 block font-medium">Footer note</span>
          <input
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none ring-simelabs/40 focus:ring-2"
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        <p className="type-caption font-semibold uppercase text-muted">Prize breakdown</p>
        {rows.map((row, index) => (
          <div key={row.id ?? `new-${index}`} className="rounded-xl border border-default bg-card p-3">
            <div className="grid gap-2 sm:grid-cols-12">
              <input
                value={row.title}
                onChange={(e) => updateRow(index, { title: e.target.value })}
                placeholder="Title"
                className="rounded-lg bg-muted px-3 py-2 text-sm sm:col-span-4"
              />
              <input
                type="number"
                min={0}
                value={row.amount_inr}
                onChange={(e) => updateRow(index, { amount_inr: Number(e.target.value) || 0 })}
                placeholder="Zomato card ₹"
                className="rounded-lg bg-muted px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                value={row.winner_rule}
                onChange={(e) => updateRow(index, { winner_rule: e.target.value })}
                placeholder="Who wins"
                className="rounded-lg bg-muted px-3 py-2 text-sm sm:col-span-4"
              />
              <div className="flex gap-1 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => moveRow(index, -1)}
                  disabled={index === 0}
                  className="flex-1 rounded-lg bg-muted py-2 text-xs disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveRow(index, 1)}
                  disabled={index === rows.length - 1}
                  className="flex-1 rounded-lg bg-muted py-2 text-xs disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="flex-1 rounded-lg bg-red-500/15 py-2 text-xs text-red-400"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={row.description ?? ''}
                onChange={(e) => updateRow(index, { description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
                className="rounded-lg bg-muted px-3 py-2 text-sm sm:col-span-12"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="w-full rounded-xl border border-dashed border-default py-2 text-sm font-medium text-muted hover:border-simelabs/40 hover:text-simelabs"
        >
          + Add prize
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-xl bg-simelabs px-4 py-2.5 text-sm font-semibold text-simelabs-foreground disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save prizes'}
        </button>
        {message && <span className="text-sm text-simelabs">{message}</span>}
      </div>
    </div>
  )
}
