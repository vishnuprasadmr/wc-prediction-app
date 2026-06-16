import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FormationPitch } from '../components/FormationPitch'
import { SquadRoster } from '../components/SquadRoster'
import { TeamFlag } from '../components/TeamFlag'
import { getTeamSquad, listTeamsWithSquads } from '../data/teamSquads'
import { FORMATION_CODES, FORMATION_LABELS, type FormationCode } from '../lib/formations'

export function TeamsPage() {
  const teams = useMemo(() => listTeamsWithSquads(), [])
  const [searchParams, setSearchParams] = useSearchParams()
  const paramTeam = searchParams.get('team')
  const initialTeam = paramTeam && teams.includes(paramTeam) ? paramTeam : teams[0] ?? 'Argentina'

  const [selectedTeam, setSelectedTeam] = useState(initialTeam)
  const [query, setQuery] = useState('')
  const squad = useMemo(() => getTeamSquad(selectedTeam), [selectedTeam])
  const [formation, setFormation] = useState<FormationCode>(squad.formation)

  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return teams
    return teams.filter((t) => t.toLowerCase().includes(q))
  }, [teams, query])

  function selectTeam(team: string) {
    setSelectedTeam(team)
    const next = getTeamSquad(team)
    setFormation(next.formation)
    setSearchParams({ team }, { replace: true })
  }

  function onFormationChange(code: FormationCode) {
    setFormation(code)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="type-overline !text-[10px]">Tournament</p>
        <h2 className="type-section-title">Teams & squads</h2>
        <p className="type-caption mt-1 text-muted">
          FIFA-style pitch view — goalkeeper, defenders, midfielders & forwards
        </p>
      </div>

      <div className="rounded-2xl border border-default bg-card p-3 shadow-card">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams…"
          className="w-full rounded-xl border border-default bg-page px-3 py-2 text-sm text-theme placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-simelabs/40"
          aria-label="Search teams"
        />
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {filteredTeams.map((team) => (
            <button
              key={team}
              type="button"
              onClick={() => selectTeam(team)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                selectedTeam === team
                  ? 'border-simelabs bg-simelabs text-simelabs-foreground'
                  : 'border-default bg-muted/50 text-muted hover:text-theme'
              }`}
            >
              <TeamFlag team={team} size="xs" />
              <span className="max-w-[88px] truncate">{team}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={selectedTeam}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-2xl border border-default bg-card px-4 py-3 shadow-card"
      >
        <TeamFlag team={selectedTeam} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-theme">{selectedTeam}</h3>
          <p className="text-xs text-muted">Starting XI · {squad.players.length} players</p>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-1.5">
        {FORMATION_CODES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => onFormationChange(code)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              formation === code
                ? 'bg-simelabs text-simelabs-foreground'
                : 'bg-muted text-muted hover:text-theme'
            }`}
          >
            {FORMATION_LABELS[code]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FormationPitch formation={formation} players={squad.players} teamName={selectedTeam} />
        <SquadRoster players={squad.players} bench={squad.bench} />
      </div>

      <p className="text-center text-[10px] text-muted">
        Squads are illustrative for the prediction league.{' '}
        <Link to="/groups" className="text-simelabs underline-offset-2 hover:underline">
          View group tables
        </Link>
      </p>
    </div>
  )
}
