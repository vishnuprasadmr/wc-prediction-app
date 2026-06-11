const SPLASH_KEY = 'wc-splash-seen'

export function hasSeenSplash(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_KEY) === '1'
  } catch {
    return false
  }
}

export function markSplashSeen(): void {
  try {
    sessionStorage.setItem(SPLASH_KEY, '1')
  } catch {
    /* private browsing */
  }
}
