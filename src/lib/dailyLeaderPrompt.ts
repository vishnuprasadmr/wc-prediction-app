import { DAILY_LEADER_PROMPTS } from '../data/dailyLeaderPrompts'
import { toIstDateKey } from './timezone'

export const DAILY_LEADER_PROMPT_COUNT = DAILY_LEADER_PROMPTS.length

function dayOfYearFromDateKey(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  const start = Date.UTC(y, 0, 0)
  const current = Date.UTC(y, m - 1, d)
  return Math.floor((current - start) / 86_400_000)
}

/** Challenge line for the given IST calendar day (defaults to today). */
export function getDailyLeaderPrompt(now = Date.now()): string {
  const dateKey = toIstDateKey(new Date(now).toISOString())
  const index = dayOfYearFromDateKey(dateKey) % DAILY_LEADER_PROMPTS.length
  return DAILY_LEADER_PROMPTS[index]!
}
