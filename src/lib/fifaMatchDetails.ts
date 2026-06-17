import { FIFA_COMPETITION_ID, FIFA_SEASON_ID, MATCH_NUMBER_OFFSET } from './fifaLive'
import { fifaFetch } from './fifaFetch'
import type { Match } from './types'

const CALENDAR_CACHE_KEY = 'wc-fifa-calendar-v1'
const CALENDAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000

const PENALTY_GOAL_TYPE = 41
const OWN_GOAL_TYPE = 34

type LocaleRow = { Locale?: string; Description?: string }

export interface FifaGoalEvent {
  playerId: string
  playerName: string
  teamName: string
  minute: string
  minuteSort: number
  isPenalty: boolean
  isOwnGoal: boolean
}

export interface FifaPlayerInfo {
  name: string
  shortName?: string
  pictureUrl?: string
  teamName: string
}

export interface FifaMatchDetails {
  idMatch: string
  idStage: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  players: Map<string, FifaPlayerInfo>
  goals: FifaGoalEvent[]
}

function fifaApiUrl(path: string): string {
  return `/api/fifa/${path}`
}

function localeText(rows?: LocaleRow[] | null): string {
  if (!rows?.length) return ''
  return rows.find((r) => r.Locale?.startsWith('en'))?.Description ?? rows[0]?.Description ?? ''
}

export function parseGoalMinuteSort(minute: string): number {
  const cleaned = minute.replace(/'/g, '')
  const [base, extra] = cleaned.split('+')
  const main = Number.parseInt(base ?? '0', 10)
  const added = Number.parseInt(extra ?? '0', 10)
  if (!Number.isFinite(main)) return 0
  return main + (Number.isFinite(added) ? added : 0)
}

export function proxyFifaImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('https://digitalhub.fifa.com/')) {
    return `/api/fifa-media/${url.replace('https://digitalhub.fifa.com/', '')}`
  }
  return url
}

let calendarRowsPromise: Promise<Record<string, unknown>[]> | null = null
let calendarRowsCache: Record<string, unknown>[] | null = null
const fixtureToIdMatch = new Map<number, string>()

const LIVE_DETAILS_TTL_MS = 90_000
const liveDetailsCache = new Map<string, { details: FifaMatchDetails; expiresAt: number }>()
const liveDetailsInflight = new Map<string, Promise<FifaMatchDetails | null>>()

function indexCalendarRows(rows: Record<string, unknown>[]): void {
  fixtureToIdMatch.clear()
  for (const row of rows) {
    const matchNumber = Number(row.MatchNumber)
    const idMatch = String(row.IdMatch ?? '')
    if (!matchNumber || !idMatch) continue
    fixtureToIdMatch.set(MATCH_NUMBER_OFFSET + matchNumber, idMatch)
  }
}

function readCalendarStorage(): Record<string, unknown>[] | null {
  try {
    const raw = sessionStorage.getItem(CALENDAR_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { rows?: Record<string, unknown>[]; expiresAt?: number }
    if (!parsed.rows?.length) return null
    return parsed.rows
  } catch {
    return null
  }
}

function writeCalendarStorage(rows: Record<string, unknown>[]): void {
  try {
    sessionStorage.setItem(
      CALENDAR_CACHE_KEY,
      JSON.stringify({ rows, expiresAt: Date.now() + CALENDAR_CACHE_TTL_MS }),
    )
  } catch {
    /* quota */
  }
}

async function fetchCalendarRows(): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = []
  let continuationToken: string | undefined

  do {
    const params = new URLSearchParams({
      idCompetition: FIFA_COMPETITION_ID,
      idSeason: FIFA_SEASON_ID,
      count: '500',
      language: 'en',
    })
    if (continuationToken) params.set('continuationToken', continuationToken)

    const res = await fifaFetch(fifaApiUrl(`calendar/matches?${params}`))
    if (!res.ok) throw new Error(`FIFA calendar error: ${res.status}`)

    const data = (await res.json()) as { Results?: Record<string, unknown>[]; ContinuationToken?: string }
    results.push(...(data.Results ?? []))
    continuationToken = data.ContinuationToken
  } while (continuationToken)

  calendarRowsCache = results
  indexCalendarRows(results)
  writeCalendarStorage(results)
  return results
}

function getCalendarRows(): Promise<Record<string, unknown>[]> {
  if (calendarRowsCache?.length) return Promise.resolve(calendarRowsCache)

  const stored = readCalendarStorage()
  if (stored?.length) {
    calendarRowsCache = stored
    indexCalendarRows(stored)
  }

  if (!calendarRowsPromise) {
    calendarRowsPromise = fetchCalendarRows()
      .catch((err) => {
        calendarRowsPromise = null
        if (calendarRowsCache?.length) return calendarRowsCache
        if (stored?.length) {
          calendarRowsCache = stored
          return stored
        }
        throw err
      })
      .then((rows) => {
        calendarRowsCache = rows
        return rows
      })
  }
  return calendarRowsPromise
}

export function resetFifaCalendarCache(): void {
  calendarRowsPromise = null
  calendarRowsCache = null
  fixtureToIdMatch.clear()
  liveDetailsCache.clear()
  liveDetailsInflight.clear()
  try {
    sessionStorage.removeItem(CALENDAR_CACHE_KEY)
  } catch {
    /* ignore */
  }
}

export async function findFifaCalendarRow(apiFixtureId: number): Promise<Record<string, unknown> | null> {
  const cachedId = fixtureToIdMatch.get(apiFixtureId)
  if (cachedId) {
    return { IdMatch: cachedId, MatchNumber: apiFixtureId - MATCH_NUMBER_OFFSET }
  }

  const matchNumber = apiFixtureId - MATCH_NUMBER_OFFSET
  const rows = await getCalendarRows()
  const row = rows.find((r) => r.MatchNumber === matchNumber) ?? null
  if (row) {
    const idMatch = String(row.IdMatch ?? '')
    if (idMatch) fixtureToIdMatch.set(apiFixtureId, idMatch)
  }
  return row
}

function indexPlayers(
  teamName: string,
  players: unknown,
  map: Map<string, FifaPlayerInfo>,
): void {
  if (!Array.isArray(players)) return
  for (const raw of players) {
    const row = raw as Record<string, unknown>
    const id = String(row.IdPlayer ?? '')
    if (!id) continue
    const picture = row.PlayerPicture as { PictureUrl?: string } | undefined
    map.set(id, {
      name: localeText(row.PlayerName as LocaleRow[]),
      shortName: localeText(row.ShortName as LocaleRow[]),
      pictureUrl: proxyFifaImageUrl(picture?.PictureUrl),
      teamName,
    })
  }
}

function collectGoals(
  teamName: string,
  goals: unknown,
  players: Map<string, FifaPlayerInfo>,
): FifaGoalEvent[] {
  if (!Array.isArray(goals)) return []

  return goals.map((raw) => {
    const row = raw as Record<string, unknown>
    const playerId = String(row.IdPlayer ?? '')
    const player = players.get(playerId)
    const minute = String(row.Minute ?? '')
    const type = Number(row.Type ?? 0)
    return {
      playerId,
      playerName: player?.shortName || player?.name || 'Unknown scorer',
      teamName,
      minute,
      minuteSort: parseGoalMinuteSort(minute),
      isPenalty: type === PENALTY_GOAL_TYPE,
      isOwnGoal: type === OWN_GOAL_TYPE,
    }
  })
}

async function fetchFifaLiveMatchDetailsInner(idMatch: string): Promise<FifaMatchDetails | null> {
  const res = await fifaFetch(fifaApiUrl(`live/football/${idMatch}`))
  if (!res.ok) return null

  const data = (await res.json()) as Record<string, unknown>
  const home = data.HomeTeam as Record<string, unknown> | undefined
  const away = data.AwayTeam as Record<string, unknown> | undefined
  if (!home || !away) return null

  const homeTeam = localeText(home.TeamName as LocaleRow[])
  const awayTeam = localeText(away.TeamName as LocaleRow[])
  const players = new Map<string, FifaPlayerInfo>()

  indexPlayers(homeTeam, home.Players, players)
  indexPlayers(awayTeam, away.Players, players)

  const goals = [
    ...collectGoals(homeTeam, home.Goals, players),
    ...collectGoals(awayTeam, away.Goals, players),
  ].sort((a, b) => a.minuteSort - b.minuteSort)

  return {
    idMatch,
    idStage: String(data.IdStage ?? ''),
    homeTeam,
    awayTeam,
    homeScore: Number(home.Score ?? 0),
    awayScore: Number(away.Score ?? 0),
    players,
    goals,
  }
}

export async function fetchFifaLiveMatchDetails(idMatch: string): Promise<FifaMatchDetails | null> {
  const cached = liveDetailsCache.get(idMatch)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.details
  }

  const inflight = liveDetailsInflight.get(idMatch)
  if (inflight) return inflight

  const promise = (async () => {
    try {
      const details = await fetchFifaLiveMatchDetailsInner(idMatch)
      if (details) {
        liveDetailsCache.set(idMatch, {
          details,
          expiresAt: Date.now() + LIVE_DETAILS_TTL_MS,
        })
      }
      return details
    } catch {
      return null
    } finally {
      liveDetailsInflight.delete(idMatch)
    }
  })()

  liveDetailsInflight.set(idMatch, promise)
  return promise
}

export async function fetchFifaMatchDetails(match: Match): Promise<FifaMatchDetails | null> {
  if (!match.api_fixture_id) return null

  try {
    const row = await findFifaCalendarRow(match.api_fixture_id)
    const idMatch = row ? String(row.IdMatch ?? '') : ''
    if (!idMatch) return null
    return await fetchFifaLiveMatchDetails(idMatch)
  } catch {
    return null
  }
}
