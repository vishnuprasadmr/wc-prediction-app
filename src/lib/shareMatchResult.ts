import type { Match } from './types'
import { fetchFifaMatchDetails } from './fifaMatchDetails'
import { buildMatchResultShare, type MatchResultShare } from './matchResultStory'
import { formatShareDateIst } from './timezone'
import { renderMatchResultBlob } from './shareImage/renderMatchResultCard'
import type { MatchResultCardInput } from './shareImage/matchResultTypes'
import { shareStandings, type ShareResult } from './shareStandings'
import { downloadShareImage } from './shareDownload'

export function buildMatchResultShareText(result: MatchResultShare): string {
  const lines = [
    '⚽ Simelabs WC 2026 — Full Time',
    `${result.homeTeam} ${result.homeScore}–${result.awayScore} ${result.awayTeam}`,
    result.winnerLabel,
    result.hero.headline,
  ]

  if (result.scorers.length > 0) {
    lines.push('')
    lines.push('Goal scorers:')
    for (const s of result.scorers) {
      lines.push(`⚽ ${s.playerName} (${s.minutes.join(', ')})`)
    }
  }

  lines.push('')
  lines.push('Join the league and predict every match!')
  return lines.join('\n')
}

export async function resolveMatchResultShare(match: Match): Promise<MatchResultShare> {
  const details = await fetchFifaMatchDetails(match)
  return buildMatchResultShare(match, details)
}

export function prepareMatchResultBlob(result: MatchResultShare): Promise<Blob> {
  return renderMatchResultBlob({ result, dateLabel: formatShareDateIst() })
}

export async function shareMatchResultWithImage(
  match: Match,
  existing?: MatchResultShare,
  preparedBlob?: Blob | null,
): Promise<ShareResult> {
  const result = existing ?? (await resolveMatchResultShare(match))
  const text = buildMatchResultShareText(result)
  const payload: MatchResultCardInput = {
    result,
    dateLabel: formatShareDateIst(),
  }

  try {
    const blob = preparedBlob ?? (await renderMatchResultBlob(payload))
    return shareStandings(text, blob)
  } catch {
    return shareStandings(text)
  }
}

export async function downloadMatchResultImage(
  match: Match,
  existing?: MatchResultShare,
  preparedBlob?: Blob | null,
): Promise<boolean> {
  try {
    const result = existing ?? (await resolveMatchResultShare(match))
    const blob = preparedBlob ?? (await renderMatchResultBlob({ result, dateLabel: formatShareDateIst() }))
    return downloadShareImage(blob, 'wc-fulltime-share.png')
  } catch {
    return false
  }
}
