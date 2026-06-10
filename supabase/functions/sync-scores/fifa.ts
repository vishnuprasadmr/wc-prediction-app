export const FIFA_API = 'https://api.fifa.com/api/v3/calendar/matches'
export const FIFA_SEASON_ID = '285023'
export const FIFA_COMPETITION_ID = '17'
export const MATCH_NUMBER_OFFSET = 1999

const LIVE_STATUSES = new Set([3, 4, 5, 6, 7, 8, 9])
const FINISHED_STATUSES = new Set([0, 10, 11])
const POSTPONED_STATUSES = new Set([12, 13, 14])

export interface FifaMatch {
  MatchNumber: number
  MatchStatus: number
  HomeTeamScore: number | null
  AwayTeamScore: number | null
  Home?: { Score: number | null } | null
  Away?: { Score: number | null } | null
}

export function mapFifaStatus(
  status: number,
  home: number | null,
  away: number | null,
): 'scheduled' | 'live' | 'finished' | 'postponed' {
  if (POSTPONED_STATUSES.has(status)) return 'postponed'
  if (LIVE_STATUSES.has(status)) return 'live'
  if (FINISHED_STATUSES.has(status)) return 'finished'
  if (home !== null && away !== null && status !== 1 && status !== 2) return 'finished'
  return 'scheduled'
}

export function extractScores(m: FifaMatch): [number | null, number | null] {
  const home = m.HomeTeamScore ?? m.Home?.Score ?? null
  const away = m.AwayTeamScore ?? m.Away?.Score ?? null
  return [home, away]
}

export async function fetchAllFifaMatches(): Promise<FifaMatch[]> {
  const results: FifaMatch[] = []
  let continuationToken: string | undefined

  do {
    const params = new URLSearchParams({
      idCompetition: FIFA_COMPETITION_ID,
      idSeason: FIFA_SEASON_ID,
      count: '500',
      language: 'en',
    })
    if (continuationToken) params.set('continuationToken', continuationToken)

    const res = await fetch(`${FIFA_API}?${params}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`FIFA API error: ${res.status}`)

    const data = await res.json()
    results.push(...(data.Results ?? []))
    continuationToken = data.ContinuationToken
  } while (continuationToken)

  return results
}
