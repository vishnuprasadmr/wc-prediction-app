const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

export function isLocalAppOrigin(origin: string): boolean {
  return LOCAL_ORIGIN.test(normalizeOrigin(origin))
}

/**
 * OAuth redirect base URL.
 * - Browser on localhost / 127.0.0.1 → always that origin (dev, preview, prod build).
 * - Deployed site → `VITE_APP_URL` when set, else current origin.
 */
export function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const browserOrigin = normalizeOrigin(window.location.origin)
    if (import.meta.env.DEV || isLocalAppOrigin(browserOrigin)) {
      return browserOrigin
    }
  }

  const configured = (import.meta.env.VITE_APP_URL as string | undefined)?.trim()

  if (configured) {
    return normalizeOrigin(configured)
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeOrigin(window.location.origin)
  }

  return ''
}
export function appAuthRedirect(path: '/login' | '/register'): string {
  const origin = getAppOrigin()
  if (!origin) {
    throw new Error('App URL is not configured. Set VITE_APP_URL on your host.')
  }
  return `${origin}${path}`
}
