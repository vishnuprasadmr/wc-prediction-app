import { useMemo, useState, useEffect } from 'react'
import { useMatches } from '../hooks/useMatches'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useLastMatchHero } from '../hooks/useLastMatchHero'
import { useMatchResultShare } from '../hooks/useMatchResultShare'
import type { LeaderboardLeague } from '../lib/leaderboardUtils'
import { getRecentFinishedMatches, getUpcomingShareMatches } from '../lib/matchUtils'
import {
  buildLeagueTableShareText,
  downloadLeagueTableImage,
  shareLeagueTableWithImage,
  buildLeagueTableShareInput,
  prepareLeagueTableBlob,
} from '../lib/shareLeagueTable'
import {
  buildMatchResultShareText,
  downloadMatchResultImage,
  shareMatchResultWithImage,
  prepareMatchResultBlob,
} from '../lib/shareMatchResult'
import {
  buildLeaderShareText,
  downloadLeaderImage,
  shareLeaderWithImage,
  prepareLeaderCardBlob,
} from '../lib/shareLeaderCard'
import {
  buildMatchdayShareInput,
  buildMatchdayShareText,
  downloadMatchdayImage,
  shareMatchdayWithImage,
  prepareMatchdayBlob,
} from '../lib/shareMatchday'
import {
  buildUpcomingMatchShareText,
  downloadUpcomingMatchImage,
  shareUpcomingMatchWithImage,
  prepareUpcomingMatchBlob,
} from '../lib/shareUpcomingMatch'
import { useUpcomingMatchShare } from '../hooks/useUpcomingMatchShare'
import { useMealChallenges } from '../hooks/useMealChallenges'
import { formatKickoffIst } from '../lib/timezone'
import { shareStandings, shareResultMessage, type ShareResult } from '../lib/shareStandings'
import { useShareBlobCache } from '../hooks/useShareBlobCache'
import { getDailyLeaderPrompt } from '../lib/dailyLeaderPrompt'
import { resolveCachedAvatarUrl } from '../lib/avatarCache'
import {
  buildMealChallengeShare,
  buildMealChallengeShareText,
  downloadMealChallengeImage,
  prepareMealChallengeBlob,
  shareMealChallengeWithImage,
} from '../lib/shareMealChallenge'
import {
  buildGameSnapshotInput,
  buildGameSnapshotShareText,
  downloadGameSnapshotImage,
  prepareGameSnapshotBlob,
  shareGameSnapshotWithImage,
} from '../lib/shareGameSnapshot'
import {
  buildShootoutVictoryInput,
  buildShootoutVictoryShareText,
  downloadShootoutVictoryImage,
  prepareShootoutVictoryBlob,
  shareShootoutVictoryWithImage,
} from '../lib/shareShootoutVictory'
import {
  buildPrizeWinnerInput,
  buildPrizeWinnerShareText,
  downloadPrizeWinnerImage,
  preparePrizeWinnerBlob,
  sharePrizeWinnerWithImage,
} from '../lib/sharePrizeWinner'
import { useFinaleParty } from '../hooks/useFinaleParty'
import { maskGiftCardNumber } from '../lib/finaleParty'
import { formatInr } from '../lib/prizes'
import { supabase } from '../lib/supabase'
import { useShootoutChallenges } from '../hooks/useShootoutChallenges'
import { LeaderboardAvatar } from './LeaderboardAvatar'
import type { Match } from '../lib/types'

const TOP_N_OPTIONS = [5, 10, 15] as const

type ShareTab =
  | 'snapshot'
  | 'upcoming'
  | 'fulltime'
  | 'meal-live'
  | 'meal-result'
  | 'leaderboard'
  | 'leader'
  | 'matchday'
  | 'arena'
  | 'prizes'

function HeroPreview({
  pictureUrl,
  headline,
  subline,
  badge,
}: {
  pictureUrl?: string
  headline: string
  subline: string
  badge?: string
}) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const showPhoto = pictureUrl && !photoFailed

  return (
    <div className="overflow-hidden rounded-xl border border-default">
      <div className="relative min-h-[140px] bg-black">
        {showPhoto ? (
          <img
            src={pictureUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-right-top opacity-70"
            onError={() => setPhotoFailed(true)}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="relative p-4">
          <p className="mt-1 text-lg font-bold text-theme">{headline}</p>
          <p className="text-sm text-subtle">{subline}</p>
          {badge && (
            <span className="mt-2 inline-block rounded-full bg-simelabs/15 px-2.5 py-0.5 text-xs font-semibold text-simelabs">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ShareActions({
  busy,
  disabled,
  onShare,
  onDownload,
  onCopy,
}: {
  busy: boolean
  disabled: boolean
  onShare: () => void
  onDownload: () => void
  onCopy: () => void
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy || disabled}
        onClick={onShare}
        className="rounded-xl bg-simelabs px-4 py-2.5 text-sm font-semibold text-simelabs-foreground disabled:opacity-50"
      >
        Share image
      </button>
      <button
        type="button"
        disabled={busy || disabled}
        onClick={onDownload}
        className="rounded-xl border border-default px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        Download PNG
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onCopy}
        className="rounded-xl border border-default px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        Copy text
      </button>
    </div>
  )
}

export function AdminSharePanel() {
  const { matches } = useMatches()
  const { live: liveMealBets, settled: settledMealBets } = useMealChallenges(matches)
  const [tab, setTab] = useState<ShareTab>('prizes')
  const [league, setLeague] = useState<LeaderboardLeague>('simelabs')
  const [topN, setTopN] = useState<number>(10)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [selectedUpcomingId, setSelectedUpcomingId] = useState<string | null>(null)
  const [selectedMealLiveId, setSelectedMealLiveId] = useState<string | null>(null)
  const [selectedMealResultId, setSelectedMealResultId] = useState<string | null>(null)
  const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null)
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null)
  const [prizeProfiles, setPrizeProfiles] = useState<
    Record<string, { display_name: string; avatar_url: string | null }>
  >({})
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { allCompleted: arenaCompleted, loading: arenaLoading } = useShootoutChallenges()
  const { adminAwards, awards: publicAwards, loading: prizeLoading } = useFinaleParty({
    admin: true,
  })

  const prizeAwards = useMemo(() => {
    const rows = adminAwards.length > 0 ? adminAwards : publicAwards
    return rows.filter((a) => a.user_id && !String(a.slot_key).startsWith('matchday_hero'))
  }, [adminAwards, publicAwards])

  useEffect(() => {
    const ids = [...new Set(prizeAwards.map((a) => a.user_id).filter(Boolean))] as string[]
    if (ids.length === 0) {
      setPrizeProfiles({})
      return
    }
    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', ids)
      const map: Record<string, { display_name: string; avatar_url: string | null }> = {}
      for (const p of data ?? []) {
        map[p.id as string] = {
          display_name: (p.display_name as string) || 'Winner',
          avatar_url: (p.avatar_url as string | null) ?? null,
        }
      }
      setPrizeProfiles(map)
    })()
  }, [prizeAwards])

  const selectedArena = useMemo(
    () => arenaCompleted.find((c) => c.id === selectedArenaId) ?? arenaCompleted[0] ?? null,
    [arenaCompleted, selectedArenaId],
  )

  const arenaVictoryInput = useMemo(
    () => (selectedArena ? buildShootoutVictoryInput(selectedArena) : null),
    [selectedArena],
  )

  const selectedPrize = useMemo(
    () => prizeAwards.find((a) => a.id === selectedPrizeId) ?? prizeAwards[0] ?? null,
    [prizeAwards, selectedPrizeId],
  )

  const prizeWinnerInput = useMemo(() => {
    if (!selectedPrize?.user_id) return null
    const profile = prizeProfiles[selectedPrize.user_id]
    const enriched = {
      ...selectedPrize,
      winner_display_name:
        selectedPrize.winner_display_name ?? profile?.display_name ?? 'Winner',
      winner_avatar_url: selectedPrize.winner_avatar_url ?? profile?.avatar_url ?? null,
      masked_card:
        selectedPrize.masked_card ??
        maskGiftCardNumber(
          'zomato_code' in selectedPrize
            ? (selectedPrize as { zomato_code?: string | null }).zomato_code
            : null,
        ),
    }
    return buildPrizeWinnerInput(enriched)
  }, [selectedPrize, prizeProfiles])

  const { entries, loading } = useLeaderboard('all', league)
  const { lastMatch, hero, loading: heroLoading, error: heroError } = useLastMatchHero(matches)

  const finishedMatches = useMemo(() => getRecentFinishedMatches(matches), [matches])
  const upcomingMatches = useMemo(() => getUpcomingShareMatches(matches), [matches])
  const selectedMatch = useMemo(
    () => finishedMatches.find((m) => m.id === selectedMatchId) ?? finishedMatches[0] ?? null,
    [finishedMatches, selectedMatchId],
  )

  const selectedUpcoming = useMemo(
    () => upcomingMatches.find((m) => m.id === selectedUpcomingId) ?? upcomingMatches[0] ?? null,
    [upcomingMatches, selectedUpcomingId],
  )

  const selectedMealLive = useMemo(
    () => liveMealBets.find((c) => c.id === selectedMealLiveId) ?? liveMealBets[0] ?? null,
    [liveMealBets, selectedMealLiveId],
  )

  const settledMealResults = useMemo(
    () => settledMealBets.filter((c) => c.status === 'settled'),
    [settledMealBets],
  )

  const selectedMealResult = useMemo(
    () =>
      settledMealResults.find((c) => c.id === selectedMealResultId) ??
      settledMealResults[0] ??
      null,
    [settledMealResults, selectedMealResultId],
  )

  const mealLiveShare = useMemo(
    () => (selectedMealLive ? buildMealChallengeShare(selectedMealLive, 'live') : null),
    [selectedMealLive],
  )

  const mealResultShare = useMemo(
    () => (selectedMealResult ? buildMealChallengeShare(selectedMealResult, 'result') : null),
    [selectedMealResult],
  )

  const { result: matchResult, loading: resultLoading } = useMatchResultShare(
    tab === 'fulltime' ? selectedMatch : null,
  )

  const { share: upcomingShare, loading: upcomingLoading } = useUpcomingMatchShare(
    tab === 'upcoming' ? selectedUpcoming : null,
  )

  const tableEntries = useMemo(() => entries.slice(0, topN), [entries, topN])
  const topThree = useMemo(() => entries.slice(0, 3), [entries])
  const dailyLeaderPrompt = useMemo(() => getDailyLeaderPrompt(), [])
  const leagueLabel = league === 'simelabs' ? 'Simelabs league' : 'Global league'
  const matchdayPreview = useMemo(() => buildMatchdayShareInput(finishedMatches), [finishedMatches])
  const leagueTablePayload = useMemo(
    () =>
      buildLeagueTableShareInput({
        entries: tableEntries,
        hero: hero ?? undefined,
        matches,
        leagueLabel,
      }),
    [tableEntries, hero, matches, leagueLabel],
  )

  const finishedMatchCount = useMemo(
    () =>
      matches.filter(
        (m) => m.status === 'finished' && m.home_score != null && m.away_score != null,
      ).length,
    [matches],
  )

  const gameSnapshotInput = useMemo(
    () =>
      buildGameSnapshotInput({
        entries,
        leagueLabel,
        lastMatch,
        liveMealBets,
        settledMealBets: settledMealResults,
        finishedMatchCount,
      }),
    [entries, leagueLabel, lastMatch, liveMealBets, settledMealResults, finishedMatchCount],
  )

  const { blob: fulltimeBlob, generating: fulltimeGenerating } = useShareBlobCache(
    () => prepareMatchResultBlob(matchResult!),
    tab === 'fulltime' && Boolean(matchResult),
    [matchResult, tab],
  )
  const { blob: leagueTableBlob, generating: leagueTableGenerating } = useShareBlobCache(
    () => prepareLeagueTableBlob(leagueTablePayload),
    tab === 'leaderboard' && tableEntries.length > 0 && !heroLoading,
    [leagueTablePayload, tab, heroLoading, tableEntries.length],
  )
  const { blob: leaderBlob, generating: leaderGenerating } = useShareBlobCache(
    () => prepareLeaderCardBlob(topThree, leagueLabel),
    tab === 'leader' && topThree.length > 0,
    [topThree, leagueLabel, tab],
  )
  const { blob: matchdayBlob, generating: matchdayGenerating } = useShareBlobCache(
    () => prepareMatchdayBlob(finishedMatches),
    tab === 'matchday' && matchdayPreview.matches.length > 0,
    [finishedMatches, tab, matchdayPreview.matches.length],
  )
  const { blob: upcomingBlob, generating: upcomingGenerating } = useShareBlobCache(
    () => prepareUpcomingMatchBlob(upcomingShare!),
    tab === 'upcoming' && Boolean(upcomingShare),
    [upcomingShare, tab],
  )
  const { blob: mealLiveBlob, generating: mealLiveGenerating } = useShareBlobCache(
    () => prepareMealChallengeBlob(mealLiveShare!),
    tab === 'meal-live' && Boolean(mealLiveShare),
    [mealLiveShare, tab],
  )
  const { blob: mealResultBlob, generating: mealResultGenerating } = useShareBlobCache(
    () => prepareMealChallengeBlob(mealResultShare!),
    tab === 'meal-result' && Boolean(mealResultShare),
    [mealResultShare, tab],
  )
  const { blob: snapshotBlob, generating: snapshotGenerating } = useShareBlobCache(
    () => prepareGameSnapshotBlob(gameSnapshotInput),
    tab === 'snapshot' && entries.length > 0,
    [gameSnapshotInput, tab, entries.length],
  )
  const { blob: prizeBlob, generating: prizeGenerating } = useShareBlobCache(
    () => preparePrizeWinnerBlob(prizeWinnerInput!),
    tab === 'prizes' && Boolean(prizeWinnerInput),
    [prizeWinnerInput, tab],
  )

  const { blob: arenaBlob, generating: arenaGenerating } = useShareBlobCache(
    () => prepareShootoutVictoryBlob(arenaVictoryInput!),
    tab === 'arena' && Boolean(arenaVictoryInput),
    [arenaVictoryInput, tab],
  )

  const cardPreparing =
    (tab === 'snapshot' && snapshotGenerating) ||
    (tab === 'upcoming' && upcomingGenerating) ||
    (tab === 'fulltime' && fulltimeGenerating) ||
    (tab === 'meal-live' && mealLiveGenerating) ||
    (tab === 'meal-result' && mealResultGenerating) ||
    (tab === 'leaderboard' && leagueTableGenerating) ||
    (tab === 'leader' && leaderGenerating) ||
    (tab === 'matchday' && matchdayGenerating) ||
    (tab === 'arena' && arenaGenerating) ||
    (tab === 'prizes' && prizeGenerating)

  useEffect(() => {
    for (const e of topThree) {
      if (e.avatar_url) void resolveCachedAvatarUrl(e.avatar_url)
    }
  }, [topThree])

  const run = async (
    action: () => Promise<ShareResult | boolean>,
    okMsg: string,
    failMsg: string,
  ) => {
    setBusy(true)
    setStatus(cardPreparing ? 'Preparing card…' : 'Sharing…')
    const result = await action()
    const shareResult: ShareResult =
      typeof result === 'boolean' ? { ok: result } : result
    setStatus(
      shareResult.ok
        ? typeof result === 'boolean'
          ? okMsg
          : shareResultMessage(shareResult, failMsg)
        : shareResultMessage(shareResult, failMsg),
    )
    setBusy(false)
    setTimeout(() => setStatus(null), 3000)
  }

  const tabs: { id: ShareTab; label: string; hint: string }[] = [
    { id: 'prizes', label: 'Prize winners', hint: 'Poster + masked Zomato card' },
    { id: 'snapshot', label: 'Game recap', hint: 'Top 3 + latest result + meal bets' },
    { id: 'upcoming', label: 'Next match', hint: 'Captain + IST + league picks %' },
    { id: 'fulltime', label: 'Full-time', hint: 'Winner + hero + scorers' },
    { id: 'meal-live', label: 'Meal bet', hint: 'Promote a live food challenge' },
    { id: 'meal-result', label: 'Meal winner', hint: 'Who won the meal' },
    { id: 'leaderboard', label: 'Point table', hint: 'Standings + latest hero' },
    { id: 'leader', label: 'Top 3', hint: 'Podium + daily challenge' },
    { id: 'matchday', label: 'Matchday', hint: 'Recent results grid' },
    { id: 'arena', label: 'Arena win', hint: 'Shootout victory poster' },
  ]

  return (
    <div className="mb-6 rounded-2xl border border-default bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="type-section-title">Social share cards</h3>
          <p className="type-caption mt-0.5 text-muted">
            Branded images for Instagram &amp; LinkedIn — auto-filled from live results.
          </p>
        </div>
        {cardPreparing && !busy && (
          <span className="text-xs text-muted">Preparing share image…</span>
        )}
        {status && <span className="text-sm text-simelabs">{status}</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-left text-sm transition ${
              tab === t.id
                ? 'bg-simelabs text-simelabs-foreground'
                : 'bg-muted text-theme hover:opacity-90'
            }`}
          >
            <span className="font-semibold">{t.label}</span>
            <span className={`mt-0.5 block text-xs ${tab === t.id ? 'text-simelabs-foreground/80' : 'text-muted'}`}>
              {t.hint}
            </span>
          </button>
        ))}
      </div>

      {tab === 'snapshot' && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value as LeaderboardLeague)}
              className="rounded-lg bg-muted px-3 py-2 text-sm outline-none"
            >
              <option value="simelabs">Simelabs league</option>
              <option value="global">Global league</option>
            </select>
          </div>

          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
          ) : topThree.length === 0 ? (
            <p className="text-sm text-muted">No leaderboard entries yet.</p>
          ) : (
            <>
              <div className="rounded-xl border border-default p-4">
                <p className="text-xs font-semibold uppercase text-muted">Tournament snapshot</p>
                <p className="mt-1 text-sm text-subtle">
                  {finishedMatchCount} matches played · {liveMealBets.length} live meal bets ·{' '}
                  {settledMealResults.length} settled
                </p>

                {lastMatch && lastMatch.home_score != null && lastMatch.away_score != null && (
                  <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-xs font-semibold uppercase text-muted">Latest result</p>
                    <p className="mt-1 font-bold text-theme">
                      {lastMatch.home_team} {lastMatch.home_score}–{lastMatch.away_score}{' '}
                      {lastMatch.away_team}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-end justify-center gap-2">
                  {[2, 1, 3].map((rank) => {
                    const entry = topThree.find((e) => e.rank === rank)
                    if (!entry) return <div key={rank} className="min-w-0 flex-1" />
                    const isFirst = rank === 1
                    return (
                      <div key={entry.user_id} className="flex min-w-0 flex-1 flex-col items-center">
                        <LeaderboardAvatar
                          name={entry.display_name}
                          avatarUrl={entry.avatar_url}
                          size={isFirst ? 'lg' : 'md'}
                        />
                        <p className="mt-1 text-xs font-bold text-simelabs">#{entry.rank}</p>
                        <p className="w-full truncate text-center text-sm font-semibold">
                          {entry.display_name}
                        </p>
                        <p className="font-mono text-lg font-bold">{entry.total_points}</p>
                      </div>
                    )
                  })}
                </div>

                {gameSnapshotInput.mealRows.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-default pt-4">
                    <p className="text-xs font-semibold uppercase text-[#E23744]">Meal bets</p>
                    {gameSnapshotInput.mealRows.map((row, i) => (
                      <div key={i} className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
                        <p className="font-semibold text-theme">{row.matchLabel}</p>
                        <p className="text-muted">{row.line}</p>
                        {row.subline && (
                          <p
                            className={
                              row.kind === 'live' ? 'text-amber-300' : 'text-emerald-400'
                            }
                          >
                            {row.subline}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ShareActions
                busy={busy}
                disabled={loading || topThree.length === 0 || snapshotGenerating}
                onShare={() =>
                  void run(
                    () => shareGameSnapshotWithImage(gameSnapshotInput, snapshotBlob),
                    'Shared!',
                    'Could not share',
                  )
                }
                onDownload={() =>
                  void run(
                    () => downloadGameSnapshotImage(gameSnapshotInput, snapshotBlob),
                    'Downloaded!',
                    'Download failed',
                  )
                }
                onCopy={() =>
                  void run(
                    () => shareStandings(buildGameSnapshotShareText(gameSnapshotInput)),
                    'Copied!',
                    'Copy failed',
                  )
                }
              />
            </>
          )}
        </div>
      )}

      {tab === 'upcoming' && (
        <div className="mt-4 space-y-3">
          {upcomingMatches.length === 0 ? (
            <p className="text-sm text-muted">No upcoming matches to promote.</p>
          ) : (
            <>
              <select
                value={selectedUpcoming?.id ?? ''}
                onChange={(e) => setSelectedUpcomingId(e.target.value)}
                className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none"
              >
                {upcomingMatches.map((m: Match) => (
                  <option key={m.id} value={m.id}>
                    {m.home_team} vs {m.away_team} · {formatKickoffIst(m.kickoff_at)}
                  </option>
                ))}
              </select>

              {upcomingLoading || !upcomingShare ? (
                <div className="h-28 animate-pulse rounded-xl bg-muted" />
              ) : (
                <>
                  <HeroPreview
                    pictureUrl={upcomingShare.hero.pictureUrl}
                    headline={upcomingShare.hero.headline}
                    subline={upcomingShare.kickoffLabel}
                    badge="Captain spotlight"
                  />
                  <div className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
                    <p className="text-xs font-semibold uppercase text-muted">Kickoff (IST)</p>
                    <p className="mt-1 font-semibold text-theme">{upcomingShare.kickoffLabel}</p>
                    <p className="mt-1 text-muted">
                      Predictions lock {upcomingShare.lockTimeLabel} IST
                    </p>
                    {upcomingShare.crowdSentiment && upcomingShare.crowdLabel ? (
                      <div className="mt-3 rounded-lg border border-simelabs/25 bg-simelabs/5 px-3 py-2">
                        <p className="text-xs font-semibold uppercase text-simelabs">League picks</p>
                        <p className="mt-1 font-semibold text-theme">{upcomingShare.crowdLabel}</p>
                        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="bg-simelabs"
                            style={{ width: `${upcomingShare.crowdSentiment.homeWinPct}%` }}
                          />
                          <div
                            className="bg-muted-foreground/40"
                            style={{ width: `${upcomingShare.crowdSentiment.drawPct}%` }}
                          />
                          <div
                            className="bg-amber-400/80"
                            style={{ width: `${upcomingShare.crowdSentiment.awayWinPct}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted">
                          {upcomingShare.crowdSentiment.homeWinPct}% {upcomingShare.homeTeam} ·{' '}
                          {upcomingShare.crowdSentiment.drawPct}% draw ·{' '}
                          {upcomingShare.crowdSentiment.awayWinPct}% {upcomingShare.awayTeam} ·{' '}
                          {upcomingShare.crowdSentiment.totalPicks} picks
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted">No league picks yet — share after a few predictions come in.</p>
                    )}
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted">{upcomingShare.homeTeam} captain</p>
                        <p className="font-medium">
                          #{upcomingShare.homeCaptain.number} {upcomingShare.homeCaptain.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">{upcomingShare.awayTeam} captain</p>
                        <p className="font-medium">
                          #{upcomingShare.awayCaptain.number} {upcomingShare.awayCaptain.name}
                        </p>
                      </div>
                    </div>
                    {upcomingShare.venueLabel && (
                      <p className="mt-2 text-xs text-muted">{upcomingShare.venueLabel}</p>
                    )}
                  </div>
                </>
              )}

              <ShareActions
                busy={busy}
                disabled={!selectedUpcoming || upcomingLoading || !upcomingShare || upcomingGenerating}
                onShare={() =>
                  void run(
                    () =>
                      selectedUpcoming && upcomingShare
                        ? shareUpcomingMatchWithImage(selectedUpcoming, upcomingShare, upcomingBlob)
                        : Promise.resolve({ ok: false }),
                    'Shared!',
                    'Could not share',
                  )
                }
                onDownload={() =>
                  void run(
                    () =>
                      selectedUpcoming && upcomingShare
                        ? downloadUpcomingMatchImage(selectedUpcoming, upcomingShare, upcomingBlob)
                        : Promise.resolve(false),
                    'Downloaded!',
                    'Download failed',
                  )
                }
                onCopy={() =>
                  void run(
                    () =>
                      upcomingShare
                        ? shareStandings(buildUpcomingMatchShareText(upcomingShare))
                        : Promise.resolve(false),
                    'Copied!',
                    'Copy failed',
                  )
                }
              />
            </>
          )}
        </div>
      )}

      {tab === 'fulltime' && (
        <div className="mt-4 space-y-3">
          {finishedMatches.length === 0 ? (
            <p className="text-sm text-muted">No finished matches yet.</p>
          ) : (
            <>
              <select
                value={selectedMatch?.id ?? ''}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none"
              >
                {finishedMatches.map((m: Match) => (
                  <option key={m.id} value={m.id}>
                    {m.home_team} {m.home_score}–{m.away_score} {m.away_team}
                  </option>
                ))}
              </select>

              {resultLoading || !matchResult ? (
                <div className="h-28 animate-pulse rounded-xl bg-muted" />
              ) : (
                <>
                  <HeroPreview
                    pictureUrl={matchResult.hero.pictureUrl}
                    headline={matchResult.winnerLabel}
                    subline={matchResult.hero.headline}
                    badge={
                      matchResult.isCleanSheet
                        ? 'Clean sheet'
                        : matchResult.hero.goalCount >= 3
                          ? 'Hat-trick'
                          : matchResult.hero.goalCount === 2
                            ? 'Brace'
                            : undefined
                    }
                  />
                  {matchResult.scorers.length > 0 && (
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase text-muted">Scorers</p>
                      <ul className="mt-1 space-y-0.5">
                        {matchResult.scorers.map((s) => (
                          <li key={`${s.playerName}-${s.teamName}`}>
                            ⚽ {s.playerName}{' '}
                            <span className="text-muted">({s.minutes.join(', ')})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <ShareActions
                busy={busy}
                disabled={!selectedMatch || resultLoading || !matchResult || fulltimeGenerating}
                onShare={() =>
                  void run(
                    () =>
                      selectedMatch && matchResult
                        ? shareMatchResultWithImage(selectedMatch, matchResult, fulltimeBlob)
                        : Promise.resolve({ ok: false }),
                    'Shared!',
                    'Could not share',
                  )
                }
                onDownload={() =>
                  void run(
                    () =>
                      selectedMatch && matchResult
                        ? downloadMatchResultImage(selectedMatch, matchResult, fulltimeBlob)
                        : Promise.resolve(false),
                    'Downloaded!',
                    'Download failed',
                  )
                }
                onCopy={() =>
                  void run(
                    () =>
                      matchResult
                        ? shareStandings(buildMatchResultShareText(matchResult))
                        : Promise.resolve(false),
                    'Copied!',
                    'Copy failed',
                  )
                }
              />
            </>
          )}
        </div>
      )}

      {tab === 'meal-live' && (
        <div className="mt-4 space-y-3">
          {liveMealBets.length === 0 ? (
            <p className="text-sm text-muted">
              No live meal bets — approve one under Moderation first.
            </p>
          ) : (
            <>
              <select
                value={selectedMealLive?.id ?? ''}
                onChange={(e) => setSelectedMealLiveId(e.target.value)}
                className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none"
              >
                {liveMealBets.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.match?.home_team} vs {c.match?.away_team} · {c.creator_name}:{' '}
                    {c.claim_text.slice(0, 40)}
                  </option>
                ))}
              </select>

              {mealLiveShare && selectedMealLive && (
                <div className="rounded-xl border border-[#E23744]/30 bg-[#E23744]/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#E23744]">
                    Meal bet
                  </p>
                  <p className="mt-2 text-lg font-bold text-theme">“{mealLiveShare.claimText}”</p>
                  <p className="mt-2 text-sm text-muted">
                    {mealLiveShare.creatorName} · {mealLiveShare.claimLabel}
                  </p>
                  <p className="mt-1 text-sm">
                    Or else: <span className="font-semibold">{mealLiveShare.stakeText}</span>
                  </p>
                  {mealLiveShare.acceptorsCount > 0 && (
                    <p className="mt-2 text-xs text-amber-300">
                      {mealLiveShare.acceptorsCount} accepted · {mealLiveShare.totalPointsStaked}{' '}
                      pts on the line
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted">{mealLiveShare.kickoffLabel}</p>
                </div>
              )}

              <ShareActions
                busy={busy}
                disabled={!mealLiveShare || mealLiveGenerating}
                onShare={() =>
                  void run(
                    () =>
                      mealLiveShare
                        ? shareMealChallengeWithImage(mealLiveShare, mealLiveBlob)
                        : Promise.resolve({ ok: false }),
                    'Shared!',
                    'Could not share',
                  )
                }
                onDownload={() =>
                  void run(
                    () =>
                      mealLiveShare
                        ? downloadMealChallengeImage(mealLiveShare, mealLiveBlob)
                        : Promise.resolve(false),
                    'Downloaded!',
                    'Download failed',
                  )
                }
                onCopy={() =>
                  void run(
                    () =>
                      mealLiveShare
                        ? shareStandings(buildMealChallengeShareText(mealLiveShare))
                        : Promise.resolve({ ok: false }),
                    'Copied!',
                    'Copy failed',
                  )
                }
              />
            </>
          )}
        </div>
      )}

      {tab === 'meal-result' && (
        <div className="mt-4 space-y-3">
          {settledMealResults.length === 0 ? (
            <p className="text-sm text-muted">
              No settled meal challenges yet — settle one under Moderation after full time.
            </p>
          ) : (
            <>
              <select
                value={selectedMealResult?.id ?? ''}
                onChange={(e) => setSelectedMealResultId(e.target.value)}
                className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none"
              >
                {settledMealResults.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.match?.home_team} vs {c.match?.away_team}
                    {c.winner_name ? ` · 🍽️ ${c.winner_name}` : ''}
                  </option>
                ))}
              </select>

              {mealResultShare && selectedMealResult && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                    Meal winner
                  </p>
                  {mealResultShare.scoreLabel && (
                    <p className="mt-1 text-sm text-muted">Final {mealResultShare.scoreLabel}</p>
                  )}
                  {mealResultShare.winnerName ? (
                    <div className="mt-3 flex items-center gap-3">
                      <LeaderboardAvatar name={mealResultShare.winnerName} size="lg" />
                      <div>
                        <p className="text-xl font-bold text-theme">{mealResultShare.winnerName}</p>
                        <p className="text-sm text-emerald-400">Wins the meal 🍽️</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted">
                      {mealResultShare.winnerNote ?? 'No meal winner'}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted">
                    Stake: {mealResultShare.stakeText}
                  </p>
                </div>
              )}

              <ShareActions
                busy={busy}
                disabled={!mealResultShare || mealResultGenerating}
                onShare={() =>
                  void run(
                    () =>
                      mealResultShare
                        ? shareMealChallengeWithImage(mealResultShare, mealResultBlob)
                        : Promise.resolve({ ok: false }),
                    'Shared!',
                    'Could not share',
                  )
                }
                onDownload={() =>
                  void run(
                    () =>
                      mealResultShare
                        ? downloadMealChallengeImage(mealResultShare, mealResultBlob)
                        : Promise.resolve(false),
                    'Downloaded!',
                    'Download failed',
                  )
                }
                onCopy={() =>
                  void run(
                    () =>
                      mealResultShare
                        ? shareStandings(buildMealChallengeShareText(mealResultShare))
                        : Promise.resolve({ ok: false }),
                    'Copied!',
                    'Copy failed',
                  )
                }
              />
            </>
          )}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="mt-4 space-y-3">
          {heroLoading ? (
            <div className="h-28 animate-pulse rounded-xl bg-muted" />
          ) : hero ? (
            <HeroPreview
              pictureUrl={hero.pictureUrl}
              headline={hero.headline}
              subline={hero.subline}
              badge={
                hero.goalCount >= 3 ? 'Hat-trick' : hero.goalCount === 2 ? 'Brace' : hero.goalCount ? 'Goal' : undefined
              }
            />
          ) : null}

          {heroError && (
            <p className="text-xs text-amber-400">Live scorer data unavailable — using scoreline fallback.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value as LeaderboardLeague)}
              className="rounded-lg bg-muted px-3 py-2 text-sm outline-none"
            >
              <option value="simelabs">Simelabs league</option>
              <option value="global">Global league</option>
            </select>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="rounded-lg bg-muted px-3 py-2 text-sm outline-none"
            >
              {TOP_N_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  Top {n}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-default">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default bg-muted/50 text-left text-xs text-muted">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Player</th>
                    <th className="px-3 py-2 text-right">Pts</th>
                    <th className="px-3 py-2 text-right">Exact</th>
                  </tr>
                </thead>
                <tbody>
                  {tableEntries.map((e) => (
                    <tr key={e.user_id} className="border-b border-default/50 last:border-0">
                      <td className="px-3 py-2 font-mono text-muted">{e.rank}</td>
                      <td className="px-3 py-2 font-medium">{e.display_name}</td>
                      <td className="px-3 py-2 text-right font-semibold text-simelabs">{e.total_points}</td>
                      <td className="px-3 py-2 text-right text-muted">{e.exact_scores}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ShareActions
            busy={busy}
            disabled={loading || heroLoading || tableEntries.length === 0 || leagueTableGenerating}
            onShare={() =>
              void run(
                () =>
                  shareLeagueTableWithImage({
                    entries: tableEntries,
                    hero: hero ?? undefined,
                    matches,
                    leagueLabel,
                    preparedBlob: leagueTableBlob,
                  }),
                'Shared!',
                'Could not share',
              )
            }
            onDownload={() =>
              void run(
                () =>
                  downloadLeagueTableImage(
                    buildLeagueTableShareInput({
                      entries: tableEntries,
                      hero: hero ?? undefined,
                      matches,
                      leagueLabel,
                    }),
                    leagueTableBlob,
                  ),
                'Downloaded!',
                'Download failed',
              )
            }
            onCopy={() =>
              void run(
                () =>
                  shareStandings(
                    buildLeagueTableShareText({
                      entries: tableEntries,
                      hero: hero ?? undefined,
                      lastMatch,
                      leagueLabel,
                    }),
                  ),
                'Copied!',
                'Copy failed',
              )
            }
          />
        </div>
      )}

      {tab === 'leader' && (
        <div className="mt-4 space-y-3">
          {topThree.length === 0 ? (
            <p className="text-sm text-muted">No leaderboard entries yet.</p>
          ) : (
            <>
              <p className="rounded-xl bg-muted/40 px-3 py-2 text-center text-sm italic text-theme">
                {dailyLeaderPrompt}
              </p>

              <div className="flex items-end justify-center gap-2 px-1">
                {[2, 1, 3].map((rank) => {
                  const entry = topThree.find((e) => e.rank === rank)
                  if (!entry) return <div key={rank} className="min-w-0 flex-1" />
                  const isFirst = rank === 1
                  const barH = isFirst ? 'h-24' : rank === 2 ? 'h-20' : 'h-16'
                  return (
                    <div
                      key={entry.user_id}
                      className={`flex min-w-0 flex-1 flex-col items-center ${isFirst ? '-mt-3' : ''}`}
                    >
                      <LeaderboardAvatar
                        name={entry.display_name}
                        avatarUrl={entry.avatar_url}
                        size={isFirst ? 'xl' : 'lg'}
                      />
                      <p className="mt-2 w-full truncate text-center text-xs font-bold text-simelabs">
                        #{entry.rank}
                      </p>
                      <p className="w-full truncate text-center text-sm font-semibold">{entry.display_name}</p>
                      <div
                        className={`mt-2 flex w-full flex-col items-center justify-center rounded-xl border px-1 ${barH} ${
                          isFirst
                            ? 'border-amber-400/50 bg-amber-400/10'
                            : rank === 2
                              ? 'border-simelabs/40 bg-simelabs/10'
                              : 'border-default bg-muted/50'
                        }`}
                      >
                        <span
                          className={`font-mono font-extrabold leading-none ${isFirst ? 'text-2xl text-amber-400' : 'text-xl text-theme'}`}
                        >
                          {entry.total_points}
                        </span>
                        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                          pts
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <select
                value={league}
                onChange={(e) => setLeague(e.target.value as LeaderboardLeague)}
                className="rounded-lg bg-muted px-3 py-2 text-sm outline-none"
              >
                <option value="simelabs">Simelabs league</option>
                <option value="global">Global league</option>
              </select>

              <ShareActions
                busy={busy}
                disabled={loading || topThree.length === 0 || leaderGenerating}
                onShare={() =>
                  void run(
                    () => shareLeaderWithImage(topThree, leagueLabel, leaderBlob),
                    'Shared!',
                    'Could not share',
                  )
                }
                onDownload={() =>
                  void run(
                    () => downloadLeaderImage(topThree, leagueLabel, leaderBlob),
                    'Downloaded!',
                    'Download failed',
                  )
                }
                onCopy={() =>
                  void run(
                    () => shareStandings(buildLeaderShareText(topThree, leagueLabel, dailyLeaderPrompt)),
                    'Copied!',
                    'Copy failed',
                  )
                }
              />
            </>
          )}
        </div>
      )}

      {tab === 'matchday' && (
        <div className="mt-4 space-y-3">
          {matchdayPreview.matches.length === 0 ? (
            <p className="text-sm text-muted">No recent results to recap.</p>
          ) : (
            <>
              <div className="space-y-2 rounded-xl border border-default p-3">
                <p className="text-sm font-semibold">{matchdayPreview.title}</p>
                <p className="text-xs text-muted">{matchdayPreview.subtitle}</p>
                {matchdayPreview.matches.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate">{m.homeTeam}</span>
                    <span className="mx-2 shrink-0 font-mono font-bold">
                      {m.homeScore}–{m.awayScore}
                    </span>
                    <span className="truncate text-right">{m.awayTeam}</span>
                  </div>
                ))}
              </div>

              <ShareActions
                busy={busy}
                disabled={matchdayPreview.matches.length === 0 || matchdayGenerating}
                onShare={() =>
                  void run(
                    () => shareMatchdayWithImage(finishedMatches, matchdayBlob),
                    'Shared!',
                    'Could not share',
                  )
                }
                onDownload={() =>
                  void run(
                    () => downloadMatchdayImage(finishedMatches, matchdayBlob),
                    'Downloaded!',
                    'Download failed',
                  )
                }
                onCopy={() =>
                  void run(
                    () => shareStandings(buildMatchdayShareText(matchdayPreview)),
                    'Copied!',
                    'Copy failed',
                  )
                }
              />
            </>
          )}
        </div>
      )}

      {tab === 'prizes' && (
        <div className="mt-4 space-y-3">
          {prizeLoading ? (
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          ) : prizeAwards.length === 0 ? (
            <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm">
              <p className="font-semibold text-amber-300">No prize winners loaded</p>
              <p className="mt-1 text-muted">
                Open Admin → Finale (winners are published there), refresh this page, then come
                back. You can also download posters from the Finale tab.
              </p>
            </div>
          ) : (
            <>
              <select
                value={selectedPrize?.id ?? ''}
                onChange={(e) => setSelectedPrizeId(e.target.value)}
                className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none"
              >
                {prizeAwards.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                    {a.night_label ? ` · ${a.night_label}` : ''} —{' '}
                    {a.winner_display_name ??
                      (a.user_id ? prizeProfiles[a.user_id]?.display_name : null) ??
                      'Winner'}{' '}
                    · {formatInr(a.amount_inr)}
                  </option>
                ))}
              </select>

              {prizeWinnerInput && (
                <div className="rounded-xl border border-[#E23744]/35 bg-[#E23744]/5 p-4 text-center">
                  <LeaderboardAvatar
                    name={prizeWinnerInput.winnerName}
                    avatarUrl={prizeWinnerInput.winnerAvatarUrl}
                    size="lg"
                  />
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#E23744]">
                    {prizeWinnerInput.prizeTitle}
                  </p>
                  <p className="mt-1 text-xl font-bold">{prizeWinnerInput.winnerName}</p>
                  <p className="mt-1 font-heading text-2xl font-black text-simelabs">
                    {prizeWinnerInput.amountLabel}
                  </p>
                  {prizeWinnerInput.maskedCard && (
                    <p className="mt-2 font-mono text-sm font-semibold tracking-wide">
                      {prizeWinnerInput.maskedCard}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted">
                    Full PIN stays private — poster shows masked card only
                  </p>
                </div>
              )}

              <ShareActions
                busy={busy}
                disabled={!prizeWinnerInput || prizeGenerating}
                onShare={() =>
                  void run(
                    () =>
                      prizeWinnerInput
                        ? sharePrizeWinnerWithImage(prizeWinnerInput, prizeBlob)
                        : Promise.resolve({ ok: false }),
                    'Shared!',
                    'Could not share',
                  )
                }
                onDownload={() =>
                  void run(
                    () =>
                      prizeWinnerInput
                        ? downloadPrizeWinnerImage(prizeWinnerInput, prizeBlob)
                        : Promise.resolve(false),
                    'Downloaded!',
                    'Download failed',
                  )
                }
                onCopy={() =>
                  void run(
                    () =>
                      prizeWinnerInput
                        ? shareStandings(buildPrizeWinnerShareText(prizeWinnerInput))
                        : Promise.resolve({ ok: false }),
                    'Copied!',
                    'Copy failed',
                  )
                }
              />
            </>
          )}
        </div>
      )}

      {tab === 'arena' && (
        <div className="mt-4 space-y-3">
          {arenaLoading ? (
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          ) : arenaCompleted.length === 0 ? (
            <p className="text-sm text-muted">No completed Arena duels yet.</p>
          ) : (
            <>
              <select
                value={selectedArena?.id ?? ''}
                onChange={(e) => setSelectedArenaId(e.target.value)}
                className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none"
              >
                {arenaCompleted.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.winner_name} beat{' '}
                    {c.winner_id === c.challenger_id ? c.opponent_name : c.challenger_name} ·{' '}
                    {c.challenger_score}–{c.opponent_score}
                  </option>
                ))}
              </select>

              {arenaVictoryInput && selectedArena && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                  <LeaderboardAvatar
                    name={arenaVictoryInput.winnerName}
                    avatarUrl={arenaVictoryInput.winnerAvatarUrl}
                    size="lg"
                  />
                  <p className="mt-2 text-xl font-bold">{arenaVictoryInput.winnerName}</p>
                  <p className="text-sm text-muted">{arenaVictoryInput.winnerHeroLabel}</p>
                  <p className="mt-2 font-mono text-2xl font-black text-simelabs">
                    {arenaVictoryInput.challengerScore} – {arenaVictoryInput.opponentScore}
                  </p>
                  <p className="mt-1 text-xs text-muted">vs {arenaVictoryInput.loserName}</p>
                </div>
              )}

              <ShareActions
                busy={busy}
                disabled={!arenaVictoryInput || arenaGenerating}
                onShare={() =>
                  void run(
                    () =>
                      arenaVictoryInput
                        ? shareShootoutVictoryWithImage(arenaVictoryInput, arenaBlob)
                        : Promise.resolve({ ok: false }),
                    'Shared!',
                    'Could not share',
                  )
                }
                onDownload={() =>
                  void run(
                    () =>
                      arenaVictoryInput
                        ? downloadShootoutVictoryImage(arenaVictoryInput, arenaBlob)
                        : Promise.resolve(false),
                    'Downloaded!',
                    'Download failed',
                  )
                }
                onCopy={() =>
                  void run(
                    () =>
                      arenaVictoryInput
                        ? shareStandings(buildShootoutVictoryShareText(arenaVictoryInput))
                        : Promise.resolve({ ok: false }),
                    'Copied!',
                    'Copy failed',
                  )
                }
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
