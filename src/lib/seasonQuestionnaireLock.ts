import type { Match } from './types'

/** Group-stage matches — season specials stay open through these. */
export const SEASON_PICKS_GROUP_STAGES = new Set<Match['stage']>(['Group'])

/** First knockout kickoff — season picks lock here (not at the opening group match). */
export function getSeasonQuestionnaireLockAt(matches: Match[]): Date | null {
  const knockout = matches
    .filter((m) => !SEASON_PICKS_GROUP_STAGES.has(m.stage))
    .map((m) => new Date(m.kickoff_at).getTime())
    .filter((t) => !Number.isNaN(t))

  if (knockout.length === 0) return null

  return new Date(Math.min(...knockout))
}

export function isSeasonQuestionnaireLocked(matches: Match[], now = Date.now()): boolean {
  const lockAt = getSeasonQuestionnaireLockAt(matches)
  if (!lockAt) return false
  return now >= lockAt.getTime()
}

export function formatSeasonQuestionnaireLockHint(matches: Match[]): string {
  const lockAt = getSeasonQuestionnaireLockAt(matches)
  if (!lockAt) return 'Open through group stage · locks at Round of 32'
  return `Open through group stage · locks ${lockAt.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
  })} (Round of 32)`
}

export function isKnockoutStage(stage: Match['stage']): boolean {
  return !SEASON_PICKS_GROUP_STAGES.has(stage)
}
