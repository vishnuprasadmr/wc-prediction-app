import { useState } from 'react'
import { useSeasonEditPoll } from '../hooks/useSeasonEditPoll'
import { useMatches } from '../hooks/useMatches'
import { formatSeasonEditLockHint } from '../lib/seasonEditPoll'

export function AdminSeasonEditPollPanel() {
  const { matches } = useMatches()
  const {
    ready,
    unavailable,
    saving,
    poll,
    tallies,
    openPoll,
    closePoll,
    publishResults,
    openEditWindow,
    closeEditWindow,
  } = useSeasonEditPoll()
  const [message, setMessage] = useState<string | null>(null)

  if (!ready) return null
  if (unavailable) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
        <h3 className="type-section-title">Season edit poll</h3>
        <p className="type-caption mt-1 text-pretty">
          Migration not applied yet — run <code className="text-simelabs">036_season_edit_poll.sql</code>{' '}
          in Supabase.
        </p>
      </div>
    )
  }

  const run = async (action: () => Promise<void>, ok: string) => {
    setMessage(null)
    try {
      await action()
      setMessage(ok)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <h3 className="type-section-title">Season edit poll (pre-QF)</h3>
      <p className="type-caption mt-1 text-pretty">
        Ask whether players want one more edit of Golden Boot / winner / dark horse before
        Quarter-finals. Publish results, then open the edit window until first QF kickoff.
      </p>

      <div className="mt-3 rounded-xl border border-default bg-card/70 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Status</p>
        <p className="mt-0.5 text-sm font-semibold capitalize text-theme">{poll.status}</p>
        <p className="type-caption mt-1 text-pretty">{poll.question}</p>
        <p className="type-caption mt-2">
          Votes: <span className="font-semibold text-simelabs">{tallies.yes} yes</span> ·{' '}
          <span className="font-semibold">{tallies.no} no</span> · {tallies.total} total
          {tallies.total > 0 && (
            <>
              {' '}
              ({tallies.yesPct}% yes)
            </>
          )}
        </p>
        <p className="type-caption mt-1">
          Edit window:{' '}
          <span className="font-semibold text-theme">
            {poll.edit_window_open ? 'OPEN' : 'closed'}
          </span>
          {' · '}
          {formatSeasonEditLockHint(matches)}
        </p>
      </div>

      {message && (
        <p className="mt-3 text-sm text-simelabs" role="status">
          {message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || poll.status === 'open'}
          onClick={() => void run(openPoll, 'Poll is open — players can vote on Home.')}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
        >
          Open poll
        </button>
        <button
          type="button"
          disabled={saving || poll.status !== 'open'}
          onClick={() => void run(closePoll, 'Poll closed (results not published).')}
          className="rounded-xl border border-default bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
        >
          Close poll
        </button>
        <button
          type="button"
          disabled={saving || poll.status === 'published'}
          onClick={() =>
            void run(
              publishResults,
              'Results published + edit window open — users see the reveal on Home.',
            )
          }
          className="rounded-xl bg-simelabs px-4 py-2 text-sm font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark disabled:opacity-50"
        >
          Publish & open edits
        </button>
        <button
          type="button"
          disabled={saving || poll.edit_window_open}
          onClick={() =>
            void run(openEditWindow, 'Edit window open until first Quarter-final kickoff.')
          }
          className="rounded-xl border border-simelabs/40 bg-simelabs/10 px-4 py-2 text-sm font-semibold text-simelabs transition hover:bg-simelabs/20 disabled:opacity-50"
        >
          Open edit window
        </button>
        <button
          type="button"
          disabled={saving || !poll.edit_window_open}
          onClick={() => void run(closeEditWindow, 'Edit window closed manually.')}
          className="rounded-xl border border-default bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
        >
          Close edit window
        </button>
      </div>
    </div>
  )
}
