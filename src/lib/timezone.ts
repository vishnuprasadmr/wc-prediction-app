export const APP_TIMEZONE = 'Asia/Kolkata'

/** Format ISO timestamp as calendar date (YYYY-MM-DD) in IST */
export function toIstDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(new Date(iso))
}

/** Format kickoff for display in IST */
export function formatKickoffIst(iso: string): string {
  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
  return `${formatted} IST`
}

/** 24-hour kickoff time in IST (e.g. 00:30, 07:30) */
export function formatKickoffTimeIst(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

/** Add calendar days to an IST date key (YYYY-MM-DD). */
export function addIstDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0))
  return toIstDateKey(utc.toISOString())
}

/** Human-readable IST date for share cards (e.g. "17 Jun 2026"). */
export function formatShareDateIst(now = Date.now()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(now))
}

/** Today and tomorrow as IST calendar dates — used for the open prediction window. */
export function getIstTodayAndTomorrow(now = Date.now()): { today: string; tomorrow: string } {
  const today = toIstDateKey(new Date(now).toISOString())
  return { today, tomorrow: addIstDays(today, 1) }
}

/** True when kickoff falls on today or tomorrow in IST (midnight games stay open all day). */
export function isInOpenPredictionWindow(kickoffAt: string, now = Date.now()): boolean {
  const { today, tomorrow } = getIstTodayAndTomorrow(now)
  const kickoffDay = toIstDateKey(kickoffAt)
  return kickoffDay === today || kickoffDay === tomorrow
}

/** Format date header for fixture groups in IST */
export function formatIstDateHeader(dateKey: string, now = Date.now()): string {
  const { today, tomorrow } = getIstTodayAndTomorrow(now)
  if (dateKey === today) return 'Today'
  if (dateKey === tomorrow) return 'Tomorrow'

  const [y, m, d] = dateKey.split('-').map(Number)
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 6, 30)) // noon IST ≈ 06:30 UTC
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: APP_TIMEZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(utcNoon)
}

/** When a player last saved or changed a match pick — IST + short relative hint. */
export function formatLastPickUpdated(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime()
  const diffMs = Math.max(0, now - then)
  const ist = formatKickoffIst(iso)

  if (diffMs < 60_000) return `Just now · ${ist}`
  if (diffMs < 3_600_000) {
    const mins = Math.floor(diffMs / 60_000)
    return `${mins} min ago · ${ist}`
  }
  if (diffMs < 86_400_000) {
    const hours = Math.floor(diffMs / 3_600_000)
    return `${hours}h ago · ${ist}`
  }
  if (diffMs < 7 * 86_400_000) {
    const days = Math.floor(diffMs / 86_400_000)
    return `${days}d ago · ${ist}`
  }

  return ist
}
