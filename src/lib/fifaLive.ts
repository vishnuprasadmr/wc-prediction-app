import type { Match, MatchStatus } from './types'

export const FIFA_API = 'https://api.fifa.com/api/v3/calendar/matches'
export const FIFA_SEASON_ID = '285023'
export const FIFA_COMPETITION_ID = '17'
export const MATCH_NUMBER_OFFSET = 1999

const LIVE_STATUSES = new Set([3, 4, 5, 6, 7, 8, 9])
const FINISHED_STATUSES = new Set([0, 10, 11])
const POSTPONED_STATUSES = new Set([12, 13, 14])

export interface FifaMatchRow {
  MatchNumber: number
  MatchStatus: number
  HomeTeamScore: number | null
  AwayTeamScore: number | null
  Home?: { Score: number | null } | null
  Away?: { Score: number | null } | null
}

export interface FifaLiveSnapshot {
  home_score: number | null
  away_score: number | null
  status: MatchStatus
}

function mapFifaStatus(
  status: number,
  home: number | null,
  away: number | null,
): MatchStatus {
  if (POSTPONED_STATUSES.has(status)) return 'postponed'
  if (LIVE_STATUSES.has(status)) return 'live'
  if (FINISHED_STATUSES.has(status)) return 'finished'
  if (home !== null && away !== null && status !== 1 && status !== 2) return 'finished'
  return 'scheduled'
}

function extractScores(m: FifaMatchRow): [number | null, number | null] {
  const home = m.HomeTeamScore ?? m.Home?.Score ?? null
  const away = m.AwayTeamScore ?? m.Away?.Score ?? null
  return [home, away]
}

/** Proxied via Vite (dev) and Netlify _redirects (prod) to avoid FIFA CORS. */
function fifaApiUrl(params: URLSearchParams): string {
  return `/api/fifa/calendar/matches?${params}`
}

export async function fetchFifaLiveMap(): Promise<Map<number, FifaLiveSnapshot>> {
  const results: FifaMatchRow[] = []
  let continuationToken: string | undefined

  do {
    const params = new URLSearchParams({
      idCompetition: FIFA_COMPETITION_ID,
      idSeason: FIFA_SEASON_ID,
      count: '500',
      language: 'en',
    })
    if (continuationToken) params.set('continuationToken', continuationToken)

    const res = await fetch(fifaApiUrl(params), {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`FIFA API error: ${res.status}`)

    const data = await res.json()
    results.push(...(data.Results ?? []))
    continuationToken = data.ContinuationToken
  } while (continuationToken)

  const map = new Map<number, FifaLiveSnapshot>()
  for (const row of results) {
    const num = row.MatchNumber
    if (!num) continue
    const [home, away] = extractScores(row)
    const status = mapFifaStatus(row.MatchStatus, home, away)
    if (status === 'scheduled' && home === null && away === null) continue
    map.set(MATCH_NUMBER_OFFSET + num, { home_score: home, away_score: away, status })
  }

  return map
}

/** Overlay FIFA live scores onto DB matches for display (same keys as sync_scores.py). */
export function mergeMatchesWithFifaLive(
  matches: Match[],
  liveMap: Map<number, FifaLiveSnapshot>,
): Match[] {
  if (liveMap.size === 0) return matches

  return matches.map((match) => {
    if (match.manual_override || !match.api_fixture_id) return match
    const live = liveMap.get(match.api_fixture_id)
    if (!live) return match

    const hasScore =
      live.home_score !== null &&
      live.away_score !== null &&
      (live.status === 'live' || live.status === 'finished')

    if (!hasScore && live.status === 'scheduled') return match

    return {
      ...match,
      home_score: live.home_score ?? match.home_score,
      away_score: live.away_score ?? match.away_score,
      status: live.status !== 'scheduled' ? live.status : match.status,
      score_source: 'api' as const,
    }
  })
}
