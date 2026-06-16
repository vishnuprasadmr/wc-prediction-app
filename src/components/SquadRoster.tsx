import { ROLE_COLORS, ROLE_LABELS, type PlayerRole } from '../lib/formations'
import type { SquadPlayer } from '../data/teamSquads'

interface SquadRosterProps {
  players: SquadPlayer[]
  bench?: SquadPlayer[]
}

const ROLE_ORDER: PlayerRole[] = ['GK', 'DEF', 'MID', 'FWD']

export function SquadRoster({ players, bench = [] }: SquadRosterProps) {
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    players: players.filter((p) => p.role === role),
  })).filter((g) => g.players.length > 0)

  return (
    <div className="space-y-3">
      {grouped.map(({ role, players: group }) => (
        <section key={role} className="overflow-hidden rounded-2xl border border-default bg-card shadow-card">
          <div
            className="flex items-center gap-2 border-b border-default px-4 py-2.5"
            style={{ borderLeftWidth: 3, borderLeftColor: ROLE_COLORS[role] }}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white"
              style={{ backgroundColor: ROLE_COLORS[role] }}
            >
              {role}
            </span>
            <h3 className="type-label">{ROLE_LABELS[role]}</h3>
            <span className="ml-auto text-[10px] text-muted">{group.length}</span>
          </div>
          <ul className="divide-y divide-default">
            {group.map((player) => (
              <li key={`${player.number}-${player.name}`} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: ROLE_COLORS[role] }}
                >
                  {player.number}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-theme">{player.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {bench.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-dashed border-default bg-card/60">
          <div className="border-b border-default px-4 py-2.5">
            <h3 className="type-label text-muted">Bench</h3>
          </div>
          <ul className="divide-y divide-default">
            {bench.map((player) => (
              <li key={`bench-${player.number}-${player.name}`} className="flex items-center gap-3 px-4 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-semibold text-muted bg-muted">
                  {player.number}
                </span>
                <span className="text-xs text-muted">{player.name}</span>
                <span className="ml-auto text-[10px] uppercase text-muted">{player.role}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
