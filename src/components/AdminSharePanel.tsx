import { useMemo, useState } from 'react'
import { useMatches } from '../hooks/useMatches'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useLastMatchHero } from '../hooks/useLastMatchHero'
import type { LeaderboardLeague } from '../lib/leaderboardUtils'
import {
  buildLeagueTableShareText,
  downloadLeagueTableImage,
  shareLeagueTableWithImage,
  buildLeagueTableShareInput,
} from '../lib/shareLeagueTable'
import { shareStandings } from '../lib/shareStandings'

const TOP_N_OPTIONS = [5, 10, 15] as const

export function AdminSharePanel() {
  const { matches } = useMatches()
  const [league, setLeague] = useState<LeaderboardLeague>('simelabs')
  const [topN, setTopN] = useState<number>(10)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { entries, loading } = useLeaderboard('all', league)
  const { lastMatch, hero, loading: heroLoading, error: heroError } = useLastMatchHero(matches)

  const tableEntries = useMemo(() => entries.slice(0, topN), [entries, topN])
  const leagueLabel = league === 'simelabs' ? 'Simelabs league' : 'Global league'

  const sharePayload = {
    entries: tableEntries,
    hero: hero ?? undefined,
    matches,
    leagueLabel,
  }

  const handleShare = async () => {
    if (tableEntries.length === 0) {
      setStatus('No standings to share yet')
      return
    }
    setBusy(true)
    setStatus('Creating card…')
    const ok = await shareLeagueTableWithImage(sharePayload)
    setStatus(ok ? 'Shared!' : 'Could not share')
    setBusy(false)
    setTimeout(() => setStatus(null), 2500)
  }

  const handleDownload = async () => {
    if (tableEntries.length === 0) return
    setBusy(true)
    const input = buildLeagueTableShareInput(sharePayload)
    const ok = await downloadLeagueTableImage(input)
    setStatus(ok ? 'Downloaded!' : 'Download failed')
    setBusy(false)
    setTimeout(() => setStatus(null), 2500)
  }

  const handleCopyText = async () => {
    const text = buildLeagueTableShareText({
      entries: tableEntries,
      hero: hero ?? undefined,
      lastMatch,
      leagueLabel,
    })
    const ok = await shareStandings(text)
    setStatus(ok ? 'Copied!' : 'Copy failed')
    setTimeout(() => setStatus(null), 2500)
  }

  return (
    <div className="mb-6 rounded-2xl border border-default bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="type-section-title">Share standings</h3>
          <p className="type-caption mt-0.5 text-muted">
            Dynamic social card from the latest result — spotlights the match hero with their photo.
          </p>
        </div>
        {status && <span className="text-sm text-simelabs">{status}</span>}
      </div>

      {heroLoading ? (
        <div className="mt-4 h-28 animate-pulse rounded-xl bg-muted" />
      ) : hero ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-default">
          <div className="relative min-h-[140px] bg-black">
            {hero.pictureUrl ? (
              <img
                src={hero.pictureUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-right opacity-70"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            <div className="relative p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-simelabs">Match hero</p>
              <p className="mt-1 text-lg font-bold text-theme">{hero.headline}</p>
              <p className="text-sm text-subtle">{hero.subline}</p>
              {hero.goalCount > 0 && (
                <span className="mt-2 inline-block rounded-full bg-simelabs/15 px-2.5 py-0.5 text-xs font-semibold text-simelabs">
                  {hero.goalCount >= 3 ? 'Hat-trick' : hero.goalCount === 2 ? 'Brace' : 'Goal'}
                  {hero.lastMinute ? ` · ${hero.lastMinute}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">No finished matches yet — standings will share without a match hero.</p>
      )}

      {heroError && (
        <p className="mt-2 text-xs text-amber-400">
          Live scorer data unavailable — using scoreline fallback.
        </p>
      )}

      {lastMatch && !heroLoading && (
        <div className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted">Latest: </span>
          <span className="font-medium">
            {lastMatch.home_team} {lastMatch.home_score}–{lastMatch.away_score} {lastMatch.away_team}
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-muted" />
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-default">
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

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || loading || heroLoading || tableEntries.length === 0}
          onClick={() => void handleShare()}
          className="rounded-xl bg-simelabs px-4 py-2.5 text-sm font-semibold text-simelabs-foreground disabled:opacity-50"
        >
          Share image
        </button>
        <button
          type="button"
          disabled={busy || loading || heroLoading || tableEntries.length === 0}
          onClick={() => void handleDownload()}
          className="rounded-xl border border-default px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          Download PNG
        </button>
        <button
          type="button"
          disabled={loading || heroLoading || tableEntries.length === 0}
          onClick={() => void handleCopyText()}
          className="rounded-xl border border-default px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          Copy text
        </button>
      </div>
    </div>
  )
}
