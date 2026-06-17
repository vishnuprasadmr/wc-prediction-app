export interface CrowdSentiment {
  homeWinPct: number
  drawPct: number
  awayWinPct: number
  totalPicks: number
}

export type CrowdOutcome = 'home' | 'draw' | 'away'

export function parseCrowdSentimentRow(row: {
  home_win_pct: number
  draw_pct: number
  away_win_pct: number
  total_picks: number
}): CrowdSentiment {
  return {
    homeWinPct: Number(row.home_win_pct) || 0,
    drawPct: Number(row.draw_pct) || 0,
    awayWinPct: Number(row.away_win_pct) || 0,
    totalPicks: Number(row.total_picks) || 0,
  }
}

export function getDominantCrowdOutcome(sentiment: CrowdSentiment): CrowdOutcome {
  const { homeWinPct, drawPct, awayWinPct } = sentiment
  if (homeWinPct >= drawPct && homeWinPct >= awayWinPct) return 'home'
  if (awayWinPct >= drawPct && awayWinPct >= homeWinPct) return 'away'
  return 'draw'
}

export function buildCrowdSentimentLabel(
  sentiment: CrowdSentiment,
  homeTeam: string,
  awayTeam: string,
): string {
  if (sentiment.totalPicks === 0) {
    return 'No Simelabs picks yet for this match'
  }

  const dominant = getDominantCrowdOutcome(sentiment)
  const pct =
    dominant === 'home'
      ? sentiment.homeWinPct
      : dominant === 'away'
        ? sentiment.awayWinPct
        : sentiment.drawPct

  const outcomeLabel =
    dominant === 'home'
      ? `${homeTeam} win`
      : dominant === 'away'
        ? `${awayTeam} win`
        : 'a draw'

  return `Simelabs thinks: ${pct}% ${outcomeLabel}`
}
