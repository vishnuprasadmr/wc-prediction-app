import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TeamFlag } from '../components/TeamFlag'
import { useMatches } from '../hooks/useMatches'
import { buildGroupStandings, listGroupLetters } from '../lib/groupStandings'
import { formatKickoffIst } from '../lib/timezone'

export function GroupsPage() {
  const { matches, loading } = useMatches()
  const letters = useMemo(() => listGroupLetters(matches), [matches])
  const standings = useMemo(() => buildGroupStandings(matches), [matches])
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const selectedGroup = activeGroup ?? letters[0] ?? 'A'
  const table = standings.find((g) => g.group === selectedGroup)

  return (
    <div className="space-y-4">
      <div>
        <p className="type-overline !text-[10px]">Tournament</p>
        <h2 className="type-section-title">Group standings</h2>
        <p className="type-caption mt-1 text-muted">
          Live tables from finished group-stage results
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {letters.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => setActiveGroup(letter)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              selectedGroup === letter
                ? 'bg-simelabs text-simelabs-foreground'
                : 'bg-muted text-muted hover:text-theme'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {loading && (
        <div className="h-48 animate-pulse rounded-2xl bg-card" />
      )}

      {!loading && !table && (
        <div className="rounded-2xl border border-default bg-card p-6 text-center">
          <p className="text-sm text-muted">No finished matches in Group {selectedGroup} yet.</p>
        </div>
      )}

      {table && (
        <motion.div
          key={table.group}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-default bg-card shadow-card"
        >
          <div className="border-b border-default bg-simelabs/8 px-4 py-3">
            <h3 className="type-label text-simelabs">Group {table.group}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-xs">
              <thead>
                <tr className="border-b border-default text-[10px] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-2 py-2 font-semibold">Team</th>
                  <th className="px-2 py-2 text-center font-semibold">P</th>
                  <th className="px-2 py-2 text-center font-semibold">W</th>
                  <th className="px-2 py-2 text-center font-semibold">D</th>
                  <th className="px-2 py-2 text-center font-semibold">L</th>
                  <th className="px-2 py-2 text-center font-semibold">GD</th>
                  <th className="px-3 py-2 text-center font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {table.teams.map((row, index) => (
                  <tr
                    key={row.team}
                    className={`border-b border-default/60 last:border-0 ${
                      index < 2 ? 'bg-simelabs/5' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 font-medium text-muted">{index + 1}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex min-w-[7rem] items-center gap-2">
                        <TeamFlag team={row.team} size="xs" />
                        <span className="font-medium text-theme">{row.team}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center text-muted">{row.played}</td>
                    <td className="px-2 py-2.5 text-center text-muted">{row.won}</td>
                    <td className="px-2 py-2.5 text-center text-muted">{row.drawn}</td>
                    <td className="px-2 py-2.5 text-center text-muted">{row.lost}</td>
                    <td className="px-2 py-2.5 text-center font-medium">
                      {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-simelabs">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {table.matches.length > 0 && (
            <div className="border-t border-default px-4 py-3">
              <p className="type-overline mb-2 !text-[10px]">Results</p>
              <ul className="space-y-2">
                {table.matches.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate text-theme">
                      {m.home_team} {m.home_score}–{m.away_score} {m.away_team}
                    </span>
                    <span className="shrink-0 text-muted">{formatKickoffIst(m.kickoff_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
