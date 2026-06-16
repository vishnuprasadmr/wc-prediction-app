import type { LeaderboardSortKey } from '../lib/leaderboardUtils'
import type { LeaderboardEntry } from '../lib/types'

const SORT_OPTIONS: { key: LeaderboardSortKey; label: string }[] = [
  { key: 'rank', label: 'Rank' },
  { key: 'points', label: 'Points' },
  { key: 'exact', label: 'Exact' },
  { key: 'name', label: 'Name' },
]

interface LeaderboardToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  sortKey: LeaderboardSortKey
  onSortChange: (key: LeaderboardSortKey) => void
  totalCount: number
  filteredCount: number
  myEntry?: LeaderboardEntry
  onFindMe?: () => void
}

export function LeaderboardToolbar({
  search,
  onSearchChange,
  sortKey,
  onSortChange,
  totalCount,
  filteredCount,
  myEntry,
  onFindMe,
}: LeaderboardToolbarProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-default bg-card p-3 shadow-card">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search players…"
            aria-label="Search players"
            className="w-full rounded-xl border border-default bg-page py-2 pl-8 pr-3 text-sm text-theme placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-simelabs/40"
          />
        </div>
        {myEntry && onFindMe && (
          <button
            type="button"
            onClick={onFindMe}
            className="shrink-0 rounded-xl border border-simelabs/35 bg-simelabs/10 px-3 py-2 text-xs font-semibold text-simelabs transition hover:bg-simelabs/20"
          >
            Find me
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="type-caption text-muted">Sort</span>
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSortChange(key)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
              sortKey === key
                ? 'bg-simelabs text-simelabs-foreground'
                : 'bg-muted text-muted hover:text-theme'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto type-caption text-muted">
          {filteredCount === totalCount
            ? `${totalCount} players`
            : `${filteredCount} of ${totalCount}`}
        </span>
      </div>

      {myEntry && (
        <div className="flex items-center justify-between rounded-xl border border-simelabs/20 bg-simelabs/8 px-3 py-2">
          <p className="text-xs text-theme">
            <span className="font-semibold text-simelabs">You</span>
            {' · '}
            Rank #{myEntry.rank} · {myEntry.total_points} pts
          </p>
          {onFindMe && (
            <button
              type="button"
              onClick={onFindMe}
              className="text-[11px] font-semibold text-simelabs hover:underline"
            >
              Jump ↓
            </button>
          )}
        </div>
      )}
    </div>
  )
}
