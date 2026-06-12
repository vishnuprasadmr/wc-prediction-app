import { renderShareImageBlob, type ShareImageInput } from './shareImage'

export function buildStandingsShareText(input: {
  displayName: string
  rank: number
  totalPoints: number
  exactScores: number
  lastMatch?: { home: string; away: string; score: string; points: number | null }
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
  lines.push('Join the league and predict every match!')
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
        }
      : undefined,
  }
}

async function downloadShareImage(blob: Blob, filename = 'wc-predict-share.png'): Promise<boolean> {
  try {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export async function shareStandings(text: string, imageBlob?: Blob): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      if (imageBlob) {
        const file = new File([imageBlob], 'wc-predict-share.png', { type: 'image/png' })
        const payload: ShareData = { title: 'WC Predictions', text }
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ ...payload, files: [file] })
          return true
        }
      }
      await navigator.share({ title: 'WC Predictions', text })
      return true
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return false
      /* try fallbacks */
    }
  }

  if (imageBlob) {
    const downloaded = await downloadShareImage(imageBlob)
    if (downloaded) return true
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
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
  }
}): Promise<boolean> {
  const text = buildStandingsShareText({
    displayName: input.displayName,
    rank: input.rank,
    totalPoints: input.totalPoints,
    exactScores: input.exactScores,
    lastMatch: input.lastMatch,
  })

  try {
    const imageBlob = await renderShareImageBlob(buildShareImageInput(input))
    return shareStandings(text, imageBlob)
  } catch {
    return shareStandings(text)
  }
}
