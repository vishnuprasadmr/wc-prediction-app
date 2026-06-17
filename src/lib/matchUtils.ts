import type { Match, MatchStatus } from './types'
import {
  formatKickoffIst,
  formatKickoffTimeIst,
  isInOpenPredictionWindow,
} from './timezone'

/** Predictions lock this many minutes before kickoff (e.g. 12:30 kickoff → locked at 12:15) */
export const PREDICTION_LOCK_BUFFER_MINUTES = 15

/** In-app + push alert when this many minutes remain before the lock */
export const LOCK_WARNING_MINUTES = 15

/** Tab pulse + haptic when lock is this close */
export const LOCK_URGENT_MINUTES = 5

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

export function getMsUntilPredictionLock(kickoffAt: string): number {
  return getPredictionLockAt(kickoffAt).getTime() - Date.now()
}

export function isLockWarningWindow(kickoffAt: string): boolean {
  const ms = getMsUntilPredictionLock(kickoffAt)
  return ms > 0 && ms <= LOCK_WARNING_MINUTES * 60 * 1000
}

/** Live countdown until predictions lock; includes seconds when under one hour. */
export function formatLockCountdown(kickoffAt: string, now = Date.now()): string | null {
  const ms = getPredictionLockAt(kickoffAt).getTime() - now
  if (ms <= 0) return null

  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** Tick every second — `H:MM:SS` under 24h, `Dd Hh Mm` beyond. */
export function formatLockCountdownLive(kickoffAt: string, now = Date.now()): string | null {
  const ms = getPredictionLockAt(kickoffAt).getTime() - now
  if (ms <= 0) return null

  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** Scheduled, not locked, and kicking off today or tomorrow (IST). */
export function isMatchPredictable(match: Match, now = Date.now()): boolean {
  if (match.status !== 'scheduled') return false
  if (isMatchLocked(match)) return false
  return isInOpenPredictionWindow(match.kickoff_at, now)
}

/** All matches open for prediction right now (today + tomorrow IST). */
export function getPredictableMatches(matches: Match[], now = Date.now()): Match[] {
  return matches
    .filter((m) => isMatchPredictable(m, now))
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())
}

/** Earliest match in the open prediction window (alerts, hero countdown). */
export function getNextPredictableMatch(matches: Match[], now = Date.now()): Match | null {
  return getPredictableMatches(matches, now)[0] ?? null
}

export function canPredictMatch(match: Match, _matches?: Match[], now = Date.now()): boolean {
  return isMatchPredictable(match, now)
}

export function getMatchFilterStatus(match: Match): 'upcoming' | 'live' | 'finished' {
  if (match.status === 'finished') return 'finished'
  if (match.status === 'live') return 'live'
  return 'upcoming'
}

/** Home / “Next” feed — everything still to play, kickoff order. */
export function getActionableMatches(matches: Match[]): Match[] {
  return matches
    .filter((m) => m.status !== 'finished')
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())
}

/** Best scroll/highlight target: unpicked open pick → live → next kickoff. */
export function getNextFocusMatch(
  matches: Match[],
  predictions: Record<string, unknown>,
  now = Date.now(),
): Match | null {
  const predictable = getPredictableMatches(matches, now)
  const unpicked = predictable.find((m) => !predictions[m.id])
  if (unpicked) return unpicked

  const live = getLiveMatches(matches).sort(
    (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
  )[0]
  if (live) return live

  return getActionableMatches(matches)[0] ?? null
}

/** Matches with official live status from FIFA / Supabase (not merely prediction-locked). */
export function getLiveMatches(matches: Match[]): Match[] {
  return matches.filter((m) => m.status === 'live')
}

/** Most recently kicked-off finished match (tournament-wide). */
export function getLastFinishedMatch(matches: Match[]): Match | null {
  return (
    matches
      .filter(
        (m) =>
          m.status === 'finished' && m.home_score !== null && m.away_score !== null,
      )
      .sort(
        (a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
      )[0] ?? null
  )
}

/** True when FIFA score sync should run (live match or recently kicked off). */
export function isInScoreSyncWindow(match: Match, now = Date.now()): boolean {
  const kickoff = new Date(match.kickoff_at).getTime()
  const started = kickoff <= now + PREDICTION_LOCK_BUFFER_MINUTES * 60 * 1000
  const recent = kickoff >= now - 4 * 60 * 60 * 1000
  const notDone = match.status !== 'finished'
  return (match.status === 'live' || (started && notDone)) && recent
}

export function shouldPollLiveScores(matches: Match[]): boolean {
  return matches.some((m) => isInScoreSyncWindow(m))
}

/** Poll FIFA around kickoff until results land in the DB (up to 24h after start). */
export function shouldFetchFifaLive(matches: Match[], now = Date.now()): boolean {
  return matches.some((m) => {
    if (m.status === 'finished') return false
    if (m.status === 'live') return true
    const kickoff = new Date(m.kickoff_at).getTime()
    const beforeStart = kickoff <= now + 3 * 60 * 60 * 1000
    const awaitingResult = kickoff >= now - 24 * 60 * 60 * 1000
    return beforeStart && awaitingResult
  })
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
