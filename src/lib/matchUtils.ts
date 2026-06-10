import type { Match, MatchStatus } from './types'
import { formatKickoffIst, formatKickoffTimeIst } from './timezone'

/** Predictions lock this many minutes before kickoff (e.g. 12:30 kickoff → locked at 12:15) */
export const PREDICTION_LOCK_BUFFER_MINUTES = 15

export function getPredictionLockAt(kickoffAt: string): Date {
  return new Date(
    new Date(kickoffAt).getTime() - PREDICTION_LOCK_BUFFER_MINUTES * 60 * 1000,
  )
}

export function isMatchLocked(match: Match): boolean {
  if (match.status === 'live' || match.status === 'finished') return true
  return Date.now() >= getPredictionLockAt(match.kickoff_at).getTime()
}

export function formatPredictionLockTimeIst(kickoffAt: string): string {
  return formatKickoffTimeIst(getPredictionLockAt(kickoffAt).toISOString())
}

/** Earliest scheduled match that still accepts predictions */
export function getNextPredictableMatch(matches: Match[]): Match | null {
  return (
    matches
      .filter((m) => !isMatchLocked(m) && m.status === 'scheduled')
      .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())[0] ??
    null
  )
}

export function canPredictMatch(match: Match, matches: Match[]): boolean {
  const next = getNextPredictableMatch(matches)
  return next?.id === match.id
}

export function getMatchFilterStatus(match: Match): 'upcoming' | 'live' | 'finished' {
  if (match.status === 'finished') return 'finished'
  if (match.status === 'live') return 'live'
  if (isMatchLocked(match)) return 'live'
  return 'upcoming'
}

export function formatKickoff(iso: string): string {
  return formatKickoffIst(iso)
}

export function formatCountdown(iso: string): string | null {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return null

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 48) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatStageLabel(stage: string, groupName: string | null): string {
  if (groupName) return `First Stage · Group ${groupName}`
  const labels: Record<string, string> = {
    Group: 'First Stage',
    'Round of 32': 'Round of 32',
    'Round of 16': 'Round of 16',
    'Quarter-final': 'Quarter-finals',
    'Semi-final': 'Semi-finals',
    'Third place': 'Third-place play-off',
    Final: 'Final',
  }
  return labels[stage] ?? stage
}

export function statusLabel(status: MatchStatus): string {
  switch (status) {
    case 'live':
      return 'LIVE'
    case 'finished':
      return 'FT'
    case 'postponed':
      return 'PPD'
    default:
      return ''
  }
}
