import { useState } from 'react'
import { useMatchComments } from '../hooks/useMatchComments'
import { playSound } from '../lib/sounds'

export function MatchComments({ matchId, finished }: { matchId: string; finished: boolean }) {
  const { comments, loading, submitComment } = useMatchComments(matchId, finished)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  if (!finished) return null

  const handleSubmit = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    playSound('select')
    const ok = await submitComment(text)
    if (ok) setText('')
    setSaving(false)
  }

  return (
    <div className="mt-3 border-t border-default pt-3">
      <p className="type-caption mb-2 text-center font-medium">Banter line</p>

      {loading ? (
        <p className="text-center text-xs text-muted animate-pulse">Loading…</p>
      ) : comments.length > 0 ? (
        <ul className="mb-3 max-h-28 space-y-1.5 overflow-y-auto">
          {comments.map((c) => (
            <li
              key={`${c.user_id}-${c.created_at}`}
              className={`rounded-lg px-2.5 py-1.5 text-xs ${
                c.is_mine ? 'bg-simelabs/10 text-simelabs' : 'bg-muted text-subtle'
              }`}
            >
              <span className="font-semibold">{c.is_mine ? 'You' : c.display_name}: </span>
              {c.comment}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-center text-xs text-muted">No comments yet — start the banter.</p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          maxLength={120}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="One line after full-time…"
          className="input-field min-w-0 flex-1 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSubmit()
          }}
        />
        <button
          type="button"
          disabled={!text.trim() || saving}
          onClick={() => void handleSubmit()}
          className="shrink-0 rounded-xl bg-simelabs px-3 text-xs font-semibold text-simelabs-foreground disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </div>
  )
}
