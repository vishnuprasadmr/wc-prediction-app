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

/** Format date header for fixture groups in IST */
export function formatIstDateHeader(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 6, 30)) // noon IST ≈ 06:30 UTC
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: APP_TIMEZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(utcNoon)
}
