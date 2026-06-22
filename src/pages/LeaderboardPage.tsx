import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DailyRecapCard } from '../components/DailyRecapCard'
import { GloryWall } from '../components/GloryWall'
import { HeadToHeadCard } from '../components/HeadToHeadCard'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { LeaderboardToolbar } from '../components/LeaderboardToolbar'
import { ScoringRulesSheet } from '../components/ScoringRulesSheet'
import { SeasonAwardsCard } from '../components/SeasonAwardsCard'
import { useAuth } from '../contexts/AuthContext'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useLeaderboardReveal } from '../hooks/useLeaderboardReveal'
import { useMatches } from '../hooks/useMatches'
import { canViewSimelabsLeaderboard } from '../lib/employeeId'
import {
  filterLeaderboardBySearch,
  hasFinishedMatches,
  sortLeaderboardEntries,
  type LeaderboardLeague,
  type LeaderboardSortKey,
} from '../lib/leaderboardUtils'
import type { LeaderboardEntry } from '../lib/types'
import { playSound } from '../lib/sounds'

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
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [stage, setStage] = useState('all')
  const [league, setLeague] = useState<LeaderboardLeague>('global')
  const [showRules, setShowRules] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<LeaderboardSortKey>('rank')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [highlightUserId, setHighlightUserId] = useState<string | null>(null)
  const [h2hRivalId, setH2hRivalId] = useState<string | undefined>(undefined)
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { matches } = useMatches()

  const canViewSimelabs = canViewSimelabsLeaderboard(profile)

  useEffect(() => {
    if (!canViewSimelabs && league === 'simelabs') {
      setLeague('global')
    }
  }, [canViewSimelabs, league])

  const effectiveLeague: LeaderboardLeague =
    league === 'simelabs' && canViewSimelabs ? 'simelabs' : 'global'

  const tournamentStarted = useMemo(() => hasFinishedMatches(matches, 'all'), [matches])

  const rankingsAvailable = useMemo(
    () => hasFinishedMatches(matches, stage),
    [matches, stage],
  )

  const effectiveStage = rankingsAvailable ? stage : 'all'
  const { entries, heartTeams, loading } = useLeaderboard(effectiveStage, effectiveLeague)

  const { reveal: rankReveal } = useLeaderboardReveal(
    entries,
    loading,
    rankingsAvailable,
    `${effectiveStage}:${effectiveLeague}`,
  )

  const myEntry = useMemo(
    () => entries.find((e) => e.user_id === user?.id),
    [entries, user?.id],
  )

  const displayEntries = useMemo(() => {
    const searched = filterLeaderboardBySearch(entries, search)
    return sortLeaderboardEntries(searched, sortKey)
  }, [entries, search, sortKey])

  const handleSelectPlayer = useCallback((entry: LeaderboardEntry | null) => {
    setSelectedPlayerId(entry?.user_id ?? null)
  }, [])

  const findMe = useCallback(() => {
    if (!user?.id) return
    playSound('select')
    setHighlightUserId(user.id)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightUserId(null), 2400)

    requestAnimationFrame(() => {
      document
        .getElementById(`leaderboard-row-${user.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [user?.id])

  const handleSetRival = useCallback((userId: string) => {
    setH2hRivalId(userId)
    playSound('select')
  }, [])

  useEffect(() => {
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
    }
  }, [])

  const leagueTabs: { key: LeaderboardLeague; label: string }[] = canViewSimelabs
    ? [
        { key: 'global', label: 'Global' },
        { key: 'simelabs', label: 'Simelabs' },
      ]
    : [{ key: 'global', label: 'Global' }]

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
        {leagueTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLeague(key)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition ${
              effectiveLeague === key
                ? 'bg-simelabs text-simelabs-foreground'
                : 'bg-muted text-muted hover:text-theme'
            }`}
          >
            {label}
          </button>
        ))}
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

      {rankingsAvailable && entries.length > 0 && (
        <LeaderboardToolbar
          search={search}
          onSearchChange={setSearch}
          sortKey={sortKey}
          onSortChange={setSortKey}
          totalCount={entries.length}
          filteredCount={displayEntries.length}
          myEntry={myEntry}
          onFindMe={user ? findMe : undefined}
        />
      )}

      <LeaderboardTable
        entries={displayEntries}
        allEntries={entries}
        heartTeams={heartTeams}
        loading={loading}
        rankingsAvailable={rankingsAvailable}
        rankReveal={rankReveal}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={handleSelectPlayer}
        onSetRival={handleSetRival}
        onArenaChallenge={(id) => navigate(`/arena?opponent=${id}`)}
        highlightUserId={highlightUserId}
      />

      <HeadToHeadCard
        entries={entries}
        heartTeams={heartTeams}
        rivalId={h2hRivalId}
        onRivalChange={setH2hRivalId}
      />
      <GloryWall />
      <SeasonAwardsCard />

      <ScoringRulesSheet open={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}
