import { renderShareImageBlob, type ShareImageInput } from './shareImage'
import { downloadShareImage } from './shareDownload'

export type ShareResult = {
  ok: boolean
  method?: 'native' | 'download' | 'clipboard'
  cancelled?: boolean
}

export function shareResultMessage(result: ShareResult, failMsg = 'Could not share'): string {
  if (!result.ok) return result.cancelled ? 'Share cancelled' : failMsg
  if (result.method === 'download') return 'Downloaded! Attach to your post'
  if (result.method === 'clipboard') return 'Copied to clipboard'
  return 'Shared!'
}

export function buildStandingsShareText(input: {
  displayName: string
  rank: number
  totalPoints: number
  exactScores: number
  lastMatch?: { home: string; away: string; score: string; points: number | null }
  inviteUrl?: string
}): string {
  const lines = [
    `⚽ Simelabs WC 2026 Predictions`,
    `${input.displayName} — Rank #${input.rank} · ${input.totalPoints} pts · ${input.exactScores} exact`,
  ]
  if (input.lastMatch && input.lastMatch.points !== null) {
    lines.push(
      `Last: ${input.lastMatch.home} ${input.lastMatch.score} ${input.lastMatch.away} → +${input.lastMatch.points} pts`,
    )
  }
  lines.push(
    input.inviteUrl
      ? `Join the league and predict every match: ${input.inviteUrl}`
      : 'Join the league and predict every match!',
  )
  return lines.join('\n')
}

export function buildShareImageInput(input: {
  variant: ShareImageInput['variant']
  displayName: string
  avatarUrl?: string | null
  rank: number
  totalPoints: number
  exactScores: number
  lastMatch?: {
    home: string
    away: string
    score: string
    points: number | null
    homePred?: number
    awayPred?: number
    firstBonus?: number
    shootoutBonus?: number
  }
}): ShareImageInput {
  const [homeScore, awayScore] = input.lastMatch?.score.split('-').map((n) => Number(n.trim())) ?? []

  return {
    variant: input.variant,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    rank: input.rank,
    totalPoints: input.totalPoints,
    exactScores: input.exactScores,
    match: input.lastMatch
      ? {
          homeTeam: input.lastMatch.home,
          awayTeam: input.lastMatch.away,
          homeScore: Number.isFinite(homeScore) ? homeScore : 0,
          awayScore: Number.isFinite(awayScore) ? awayScore : 0,
          homePred: input.lastMatch.homePred,
          awayPred: input.lastMatch.awayPred,
          pointsEarned: input.lastMatch.points,
          firstBonus: input.lastMatch.firstBonus,
          shootoutBonus: input.lastMatch.shootoutBonus,
        }
      : undefined,
  }
}

export async function shareStandings(text: string, imageBlob?: Blob): Promise<ShareResult> {
  const file =
    imageBlob && imageBlob.size > 0
      ? new File([imageBlob], 'wc-predict-share.png', { type: 'image/png' })
      : null

  const canShareFiles = Boolean(
    file && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] }),
  )

  if (canShareFiles && file && navigator.share) {
    try {
      await navigator.share({ title: 'WC Predictions', text, files: [file] })
      return { ok: true, method: 'native' }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { ok: false, cancelled: true }
      }
    }
  }

  if (imageBlob && imageBlob.size > 0) {
    if (downloadShareImage(imageBlob)) {
      return { ok: true, method: 'download' }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share && !imageBlob) {
    try {
      await navigator.share({ title: 'WC Predictions', text })
      return { ok: true, method: 'native' }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { ok: false, cancelled: true }
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text)
    return { ok: true, method: 'clipboard' }
  } catch {
    return { ok: false }
  }
}

export async function shareStandingsWithImage(input: {
  variant: ShareImageInput['variant']
  displayName: string
  avatarUrl?: string | null
  rank: number
  totalPoints: number
  exactScores: number
  lastMatch?: {
    home: string
    away: string
    score: string
    points: number | null
    homePred?: number
    awayPred?: number
    firstBonus?: number
    shootoutBonus?: number
  }
  inviteUrl?: string
  preparedBlob?: Blob | null
}): Promise<ShareResult> {
  const text = buildStandingsShareText({
    displayName: input.displayName,
    rank: input.rank,
    totalPoints: input.totalPoints,
    exactScores: input.exactScores,
    lastMatch: input.lastMatch,
    inviteUrl: input.inviteUrl,
  })

  try {
    const imageBlob =
      input.preparedBlob ?? (await renderShareImageBlob(buildShareImageInput(input)))
    return shareStandings(text, imageBlob)
  } catch {
    return shareStandings(text)
  }
}
