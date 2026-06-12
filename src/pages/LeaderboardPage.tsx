import { useMemo, useState } from 'react'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { ScoringRulesSheet } from '../components/ScoringRulesSheet'
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
  const [showRules, setShowRules] = useState(false)
  const { matches } = useMatches()

  const tournamentStarted = useMemo(() => hasFinishedMatches(matches, 'all'), [matches])

  const rankingsAvailable = useMemo(
    () => hasFinishedMatches(matches, stage),
    [matches, stage],
  )

  const effectiveStage = rankingsAvailable ? stage : 'all'
  const { entries, heartTeams, loading } = useLeaderboard(effectiveStage)
  const { reveal: rankReveal } = useLeaderboardReveal(
    entries,
    loading,
    rankingsAvailable,
    effectiveStage,
  )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
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

      {tournamentStarted && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
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
      <ScoringRulesSheet open={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}
