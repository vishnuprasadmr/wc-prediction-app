import { supabase } from './supabase'

export interface LiveScoreSyncResult {
  success: boolean
  updated: number
  skipped: number
  unchanged: number
  mode: string
  source: string
}

/** Pull live/finished scores from FIFA into Supabase (same logic as sync_scores.py). */
export async function syncDueMatchScores(): Promise<LiveScoreSyncResult | null> {
  const { data, error } = await supabase.functions.invoke('sync-scores', {
    body: { dueOnly: true },
  })

  if (error) {
    throw new Error(error.message || 'Score sync failed')
  }

  return (data as LiveScoreSyncResult) ?? null
}
