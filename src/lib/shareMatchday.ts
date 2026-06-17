import type { Match } from './types'
import { formatShareDateIst, toIstDateKey } from './timezone'
import { renderMatchdayBlob } from './shareImage/renderMatchdayCard'
import type { MatchdayCardInput } from './shareImage/matchdayTypes'
import { shareStandings, type ShareResult } from './shareStandings'
import { downloadShareImage } from './shareDownload'

export function buildMatchdayShareInput(
  matches: Match[],
  title = 'MATCHDAY RECAP',
  now = Date.now(),
): MatchdayCardInput {
  const yesterdayKey = toIstDateKey(new Date(now - 86_400_000).toISOString())
  const rows = matches
    .filter((m) => m.status === 'finished' && m.home_score !== null && m.away_score !== null)
    .sort((a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime())
    .slice(0, 6)
    .map((m) => ({
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      homeScore: m.home_score!,
      awayScore: m.away_score!,
    }))

  const subtitle =
    rows.length > 0
      ? `${rows.length} result${rows.length === 1 ? '' : 's'} · latest finished matches`
      : 'No recent results'

  return {
    title,
    subtitle,
    matches: rows,
    dateLabel: formatShareDateIst(now),
  }
}

export function buildMatchdayShareText(input: MatchdayCardInput): string {
  const lines = ['⚽ Simelabs WC 2026 — Matchday Recap', input.subtitle, '']
  for (const m of input.matches) {
    lines.push(`${m.homeTeam} ${m.homeScore}–${m.awayScore} ${m.awayTeam}`)
  }
  lines.push('', 'Join the league and predict every match!')
  return lines.join('\n')
}

export function prepareMatchdayBlob(matches: Match[]): Promise<Blob> {
  return renderMatchdayBlob(buildMatchdayShareInput(matches))
}

export async function shareMatchdayWithImage(
  matches: Match[],
  preparedBlob?: Blob | null,
): Promise<ShareResult> {
  const payload = buildMatchdayShareInput(matches)
  const text = buildMatchdayShareText(payload)

  try {
    const blob = preparedBlob ?? (await renderMatchdayBlob(payload))
    return shareStandings(text, blob)
  } catch {
    return shareStandings(text)
  }
}

export async function downloadMatchdayImage(
  matches: Match[],
  preparedBlob?: Blob | null,
): Promise<boolean> {
  try {
    const payload = buildMatchdayShareInput(matches)
    const blob = preparedBlob ?? (await renderMatchdayBlob(payload))
    return downloadShareImage(blob, 'wc-matchday-share.png')
  } catch {
    return false
  }
}
