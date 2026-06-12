const SPLASH_AT_KEY = 'wc-splash-at'

/** Show splash again after this idle period (4 hours). */
export const SPLASH_COOLDOWN_MS = 4 * 60 * 60 * 1000

export function shouldShowSplash(now = Date.now()): boolean {
  try {
    const at = localStorage.getItem(SPLASH_AT_KEY)
    if (!at) return true
    const last = Number(at)
    if (!Number.isFinite(last)) return true
    return now - last >= SPLASH_COOLDOWN_MS
  } catch {
    return true
  }
}

/** @deprecated use shouldShowSplash */
export function hasSeenSplash(): boolean {
  return !shouldShowSplash()
}

export function markSplashSeen(now = Date.now()): void {
  try {
    localStorage.setItem(SPLASH_AT_KEY, String(now))
  } catch {
    /* private browsing */
  }
}
