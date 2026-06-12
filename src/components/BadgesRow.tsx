import type { Badge } from '../lib/badges'

export function BadgesRow({ badges }: { badges: Badge[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <span
          key={b.id}
          title={b.label}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            b.earned
              ? 'bg-simelabs/15 text-simelabs ring-1 ring-simelabs/30'
              : 'bg-muted text-muted opacity-60'
          }`}
        >
          <span>{b.icon}</span>
          <span>{b.label}</span>
        </span>
      ))}
    </div>
  )
}
