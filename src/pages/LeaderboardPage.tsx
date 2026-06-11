import { useMemo, useState } from 'react'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { ScoringRulesSheet } from '../components/ScoringRulesSheet'
import { useLeaderboard } from '../hooks/useLeaderboard'
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
  const [showRules, setShowRules] = useState(false)
  const { matches } = useMatches()

  const tournamentStarted = useMemo(() => hasFinishedMatches(matches, 'all'), [matches])

  const rankingsAvailable = useMemo(
    () => hasFinishedMatches(matches, stage),
    [matches, stage],
  )

  const effectiveStage = rankingsAvailable ? stage : 'all'
  const { entries, loading } = useLeaderboard(effectiveStage)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {rankingsAvailable ? 'Point Table' : 'League Players'}
        </h2>
        <button
          onClick={() => setShowRules(true)}
          className="text-sm text-simelabs hover:underline"
        >
          Scoring rules
        </button>
      </div>

      {tournamentStarted && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {stages.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStage(key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
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
        loading={loading}
        rankingsAvailable={rankingsAvailable}
      />
      <ScoringRulesSheet open={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}
