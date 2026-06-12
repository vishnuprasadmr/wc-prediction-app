import type { Match, Prediction } from './types'
import { getPredictableMatches } from './matchUtils'
import { formatKickoffTimeIst, toIstDateKey } from './timezone'

export interface DailyRecap {
  title: string
  body: string
  openCount: number
  finishedYesterday: Match[]
}

export function buildDailyRecap(
  matches: Match[],
  predictions: Record<string, Prediction>,
  rank?: number | null,
): DailyRecap {
  const now = Date.now()
  const today = toIstDateKey(new Date(now).toISOString())
  const yesterdayKey = toIstDateKey(new Date(now - 86_400_000).toISOString())

  const finishedYesterday = matches.filter(
    (m) => m.status === 'finished' && toIstDateKey(m.kickoff_at) === yesterdayKey,
  )

  const open = getPredictableMatches(matches)
  const unpicked = open.filter((m) => !predictions[m.id])

  const rankBit =
    rank != null && rank > 0 ? ` You're rank #${rank} on the table.` : ''

  let body = ''
  if (finishedYesterday.length > 0) {
    body += `${finishedYesterday.length} match${finishedYesterday.length === 1 ? '' : 'es'} finished yesterday.`
  }
  if (unpicked.length > 0) {
    const next = unpicked[0]
    body += ` ${unpicked.length} open for picks — next locks at ${formatKickoffTimeIst(next.kickoff_at)} IST.`
  } else if (open.length > 0) {
    body += ` All ${open.length} open matches predicted. Nice one!`
  } else {
    body += ' Check fixtures for the next kickoff.'
  }
  body += rankBit

  const todayMatches = matches.filter(
    (m) => toIstDateKey(m.kickoff_at) === today && m.status !== 'finished',
  )

  const title =
    todayMatches.length > 0
      ? `Match day · ${todayMatches.length} game${todayMatches.length === 1 ? '' : 's'} today`
      : 'League recap'

  return {
    title,
    body: body.trim(),
    openCount: unpicked.length,
    finishedYesterday,
  }
}
