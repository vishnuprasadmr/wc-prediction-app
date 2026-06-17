import { describe, expect, it } from 'vitest'
import {
  buildCrowdSentimentLabel,
  getDominantCrowdOutcome,
  parseCrowdSentimentRow,
} from './pickCrowdSentiment'

describe('pickCrowdSentiment', () => {
  it('parses rpc row', () => {
    expect(
      parseCrowdSentimentRow({
        home_win_pct: 62,
        draw_pct: 18,
        away_win_pct: 20,
        total_picks: 50,
      }),
    ).toEqual({
      homeWinPct: 62,
      drawPct: 18,
      awayWinPct: 20,
      totalPicks: 50,
    })
  })

  it('labels dominant home win', () => {
    const sentiment = { homeWinPct: 62, drawPct: 18, awayWinPct: 20, totalPicks: 10 }
    expect(getDominantCrowdOutcome(sentiment)).toBe('home')
    expect(buildCrowdSentimentLabel(sentiment, 'Brazil', 'France')).toBe(
      'Simelabs thinks: 62% Brazil win',
    )
  })

  it('handles empty picks', () => {
    const sentiment = { homeWinPct: 0, drawPct: 0, awayWinPct: 0, totalPicks: 0 }
    expect(buildCrowdSentimentLabel(sentiment, 'A', 'B')).toBe('No Simelabs picks yet for this match')
  })
})
