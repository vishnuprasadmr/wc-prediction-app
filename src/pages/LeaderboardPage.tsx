import { useMemo, useState } from 'react'
import { DailyRecapCard } from '../components/DailyRecapCard'
import { GloryWall } from '../components/GloryWall'
import { HeadToHeadCard } from '../components/HeadToHeadCard'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { ScoringRulesSheet } from '../components/ScoringRulesSheet'
import { SeasonAwardsCard } from '../components/SeasonAwardsCard'
import { DEPARTMENTS } from '../lib/departments'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useLeaderboardReveal } from '../hooks/useLeaderboardReveal'
import { useMatches } from '../hooks/useMatches'
import { hasFinishedMatches } from '../lib/leaderboardUtils'

const stages = [
  { key: 'all', label: 'Overall' },
  { key: 'Group', label: 'Groups' },
  { key: 'Round of 32', label: 'R32' },
  { key: 'Round of 16', label: 'R16' },
  { key: 'Quarter-final', label: 'QF' },
  { key: 'Semi-final', label: 'SF' },
  { key: 'Final', label: 'Final' },
]

export function LeaderboardPage() {
  const [stage, setStage] = useState('all')
  const [department, setDepartment] = useState<string>('all')
  const [showRules, setShowRules] = useState(false)
  const { matches } = useMatches()

  const tournamentStarted = useMemo(() => hasFinishedMatches(matches, 'all'), [matches])

  const rankingsAvailable = useMemo(
    () => hasFinishedMatches(matches, stage),
    [matches, stage],
  )

  const effectiveStage = rankingsAvailable ? stage : 'all'
  const { entries: rawEntries, heartTeams, loading } = useLeaderboard(effectiveStage)

  const entries = useMemo(() => {
    if (department === 'all') return rawEntries
    return rawEntries
      .filter((e) => e.department === department)
      .map((e, i) => ({ ...e, rank: i + 1 }))
  }, [rawEntries, department])

  const { reveal: rankReveal } = useLeaderboardReveal(
    entries,
    loading,
    rankingsAvailable,
    effectiveStage,
  )

  return (
    <div className="space-y-4">
      <DailyRecapCard />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="type-overline !text-[10px]">Simelabs WC 26</p>
          <h2 className="type-section-title">
            {rankingsAvailable ? 'Point Table' : 'League Players'}
          </h2>
        </div>
        <button
          onClick={() => setShowRules(true)}
          className="shrink-0 text-sm font-medium text-simelabs hover:underline"
        >
          Scoring rules
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium outline-none"
        >
          <option value="all">All depts</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {tournamentStarted && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {stages.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStage(key)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                stage === key
                  ? 'bg-simelabs text-simelabs-foreground'
                  : 'bg-muted text-muted hover:text-theme'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <LeaderboardTable
        entries={entries}
        heartTeams={heartTeams}
        loading={loading}
        rankingsAvailable={rankingsAvailable}
        rankReveal={rankReveal}
      />

      <HeadToHeadCard entries={entries} heartTeams={heartTeams} />
      <GloryWall />
      <SeasonAwardsCard />

      <ScoringRulesSheet open={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}
