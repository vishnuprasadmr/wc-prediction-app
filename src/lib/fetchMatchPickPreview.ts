import { parseCrowdSentimentRow, type CrowdSentiment } from './pickCrowdSentiment'
import { supabase } from './supabase'

export async function fetchMatchPickPreview(matchId: string): Promise<CrowdSentiment | null> {
  const { data, error } = await supabase.rpc('get_match_pick_preview', {
    match_uuid: matchId,
  })

  if (error || !data?.[0]) return null

  const row = data[0] as {
    home_win_pct: number
    draw_pct: number
    away_win_pct: number
    total_picks: number
  }

  const sentiment = parseCrowdSentimentRow(row)
  return sentiment.totalPicks > 0 ? sentiment : null
}
