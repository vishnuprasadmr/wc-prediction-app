import type { Match } from './types'

export type SeasonEditPollStatus = 'closed' | 'open' | 'published'
export type SeasonEditPollVote = 'yes' | 'no'

export interface SeasonEditPollConfig {
  id: boolean
  status: SeasonEditPollStatus
  question: string
  edit_window_open: boolean
  published_at: string | null
  edit_opened_at: string | null
  edit_closed_at: string | null
  updated_at: string
}

export interface SeasonEditPollVoteRow {
  user_id: string
  vote: SeasonEditPollVote
  created_at: string
  updated_at: string
}

export interface SeasonEditPollTallies {
  yes: number
  no: number
  total: number
  yesPct: number
  noPct: number
}

export const DEFAULT_SEASON_EDIT_POLL_QUESTION =
  'Want a chance to edit your Golden Boot, winner, dark horse & other season picks before the Quarter-finals?'

export const SEASON_EDIT_REVEAL_DISMISS_KEY = 'wc-season-edit-poll-reveal'

export function tallySeasonEditVotes(
  votes: Array<{ vote: SeasonEditPollVote }>,
): SeasonEditPollTallies {
  const yes = votes.filter((v) => v.vote === 'yes').length
  const no = votes.filter((v) => v.vote === 'no').length
  const total = yes + no
  return {
    yes,
    no,
    total,
    yesPct: total === 0 ? 0 : Math.round((yes / total) * 100),
    noPct: total === 0 ? 0 : Math.round((no / total) * 100),
  }
}

/** First Quarter-final kickoff — re-edit window closes here. */
export function getSeasonEditLockAt(matches: Match[]): Date | null {
  const qf = matches
    .filter((m) => m.stage === 'Quarter-final')
    .map((m) => new Date(m.kickoff_at).getTime())
    .filter((t) => !Number.isNaN(t))

  if (qf.length === 0) return null
  return new Date(Math.min(...qf))
}

export function isSeasonEditWindowExpired(matches: Match[], now = Date.now()): boolean {
  const lockAt = getSeasonEditLockAt(matches)
  if (!lockAt) return false
  return now >= lockAt.getTime()
}

export function formatSeasonEditLockHint(matches: Match[]): string {
  const lockAt = getSeasonEditLockAt(matches)
  if (!lockAt) return 'Edits lock at the first Quarter-final kickoff'
  return `Edit until ${lockAt.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })} IST · first Quarter-final`
}

export function isSeasonEditRevealDismissed(publishedAt: string | null): boolean {
  if (!publishedAt) return true
  try {
    return localStorage.getItem(`${SEASON_EDIT_REVEAL_DISMISS_KEY}:${publishedAt}`) === '1'
  } catch {
    return false
  }
}

export function dismissSeasonEditReveal(publishedAt: string | null): void {
  if (!publishedAt) return
  try {
    localStorage.setItem(`${SEASON_EDIT_REVEAL_DISMISS_KEY}:${publishedAt}`, '1')
  } catch {
    /* ignore */
  }
}
