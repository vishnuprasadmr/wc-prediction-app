import { DAILY_QUOTES } from '../data/dailyQuotes'
import { toIstDateKey } from './timezone'

export interface DailyQuote {
  text: string
  author?: string
  dateKey: string
  index: number
}

export const DAILY_QUOTE_COUNT = DAILY_QUOTES.length

function dayOfYearFromDateKey(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  const start = Date.UTC(y, 0, 0)
  const current = Date.UTC(y, m - 1, d)
  return Math.floor((current - start) / 86_400_000)
}

/** Quote for the given IST calendar day (defaults to today). */
export function getDailyQuote(now = Date.now()): DailyQuote {
  const dateKey = toIstDateKey(new Date(now).toISOString())
  const dayIndex = dayOfYearFromDateKey(dateKey)
  const index = dayIndex % DAILY_QUOTES.length
  const picked = DAILY_QUOTES[index]!
  return { text: picked.text, author: picked.author, dateKey, index }
}

/** Next quote in rotation (for admin preview / shuffle). */
export function getQuoteByIndex(index: number): DailyQuote {
  const safe = ((index % DAILY_QUOTES.length) + DAILY_QUOTES.length) % DAILY_QUOTES.length
  const picked = DAILY_QUOTES[safe]!
  return { text: picked.text, author: picked.author, dateKey: '', index: safe }
}
