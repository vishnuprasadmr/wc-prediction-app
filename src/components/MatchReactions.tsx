import { REACTION_OPTIONS, useMatchReactions } from '../hooks/useMatchReactions'
import { playSound } from '../lib/sounds'

export function MatchReactions({ matchId, finished }: { matchId: string; finished: boolean }) {
  const { counts, mine, react } = useMatchReactions(matchId, finished)

  if (!finished) return null

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
      {REACTION_OPTIONS.map(({ emoji, icon, label }) => {
        const count = counts[emoji]
        const active = mine === emoji
        return (
          <button
            key={emoji}
            type="button"
            title={label}
            onClick={() => {
              playSound('select')
              void react(emoji)
            }}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
              active
                ? 'bg-simelabs/20 text-simelabs ring-1 ring-simelabs/40'
                : 'bg-muted text-muted hover:text-theme'
            }`}
          >
            <span>{icon}</span>
            {count > 0 && <span className="font-semibold tabular-nums">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
