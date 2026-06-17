import type { Match } from './types'
import { fetchFifaMatchDetails } from './fifaMatchDetails'
import { buildUpcomingMatchShare, type UpcomingMatchShare } from './upcomingMatchStory'
import { formatShareDateIst } from './timezone'
import { renderUpcomingMatchBlob } from './shareImage/renderUpcomingMatchCard'
import type { UpcomingMatchCardInput } from './shareImage/upcomingMatchTypes'
import { shareStandings, type ShareResult } from './shareStandings'
import { downloadShareImage } from './shareDownload'

export function buildUpcomingMatchShareText(share: UpcomingMatchShare): string {
  const lines = [
    '⚽ Simelabs WC 2026 — Next Match',
    `${share.homeTeam} vs ${share.awayTeam}`,
    `Kickoff: ${share.kickoffLabel}`,
    `Predictions lock ${share.lockTimeLabel} IST`,
    '',
    `Captain spotlight: ${share.homeCaptain.name} vs ${share.awayCaptain.name}`,
    share.stageLabel,
  ]

  if (share.venueLabel) lines.push(share.venueLabel)
  lines.push('', share.ctaLine, '', 'Join the league and predict every match!')
  return lines.join('\n')
}

export async function resolveUpcomingMatchShare(match: Match): Promise<UpcomingMatchShare> {
  const details = await fetchFifaMatchDetails(match)
  return buildUpcomingMatchShare(match, details)
}

function toCardInput(share: UpcomingMatchShare): UpcomingMatchCardInput {
  return { match: share, dateLabel: formatShareDateIst() }
}

export function prepareUpcomingMatchBlob(share: UpcomingMatchShare): Promise<Blob> {
  return renderUpcomingMatchBlob(toCardInput(share))
}

export async function shareUpcomingMatchWithImage(
  match: Match,
  existing?: UpcomingMatchShare,
  preparedBlob?: Blob | null,
): Promise<ShareResult> {
  const share = existing ?? (await resolveUpcomingMatchShare(match))
  const text = buildUpcomingMatchShareText(share)

  try {
    const blob = preparedBlob ?? (await renderUpcomingMatchBlob(toCardInput(share)))
    return shareStandings(text, blob)
  } catch {
    return shareStandings(text)
  }
}

export async function downloadUpcomingMatchImage(
  match: Match,
  existing?: UpcomingMatchShare,
  preparedBlob?: Blob | null,
): Promise<boolean> {
  try {
    const share = existing ?? (await resolveUpcomingMatchShare(match))
    const blob = preparedBlob ?? (await renderUpcomingMatchBlob(toCardInput(share)))
    return downloadShareImage(blob, 'wc-next-match-share.png')
  } catch {
    return false
  }
}
