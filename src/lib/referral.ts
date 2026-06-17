import { getAppOrigin } from './appOrigin'

const STORAGE_KEY = 'wc-referred-by'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const MAX_REFERRAL_BONUSES = 5

export function isReferralUserId(value: string): boolean {
  return UUID_RE.test(value)
}

export function captureReferralFromUrl(search = window.location.search): void {
  if (typeof window === 'undefined') return

  const ref = new URLSearchParams(search).get('ref')?.trim()
  if (!ref || !isReferralUserId(ref)) return

  try {
    localStorage.setItem(STORAGE_KEY, ref)
  } catch {
    /* private browsing */
  }
}

export function peekStoredReferral(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)?.trim()
    return raw && isReferralUserId(raw) ? raw : null
  } catch {
    return null
  }
}

export function consumeStoredReferral(): string | null {
  const ref = peekStoredReferral()
  if (!ref) return null

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* private browsing */
  }

  return ref
}

export function buildReferralUrl(userId: string): string {
  const origin = getAppOrigin()
  return `${origin}/register?ref=${userId}`
}
