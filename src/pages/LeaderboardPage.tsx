import { useState } from 'react'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { ScoringRulesSheet } from '../components/ScoringRulesSheet'
import { useLeaderboard } from '../hooks/useLeaderboard'

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
  const { entries, loading } = useLeaderboard(stage)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Point Table</h2>
        <button
          onClick={() => setShowRules(true)}
          className="text-sm text-simelabs hover:underline"
        >
          Scoring rules
        </button>
      </div>

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

      <LeaderboardTable entries={entries} loading={loading} />
      <ScoringRulesSheet open={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}
