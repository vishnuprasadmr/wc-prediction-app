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

export async function shareStandings(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'WC Predictions', text })
      return true
    } catch {
      return false
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
