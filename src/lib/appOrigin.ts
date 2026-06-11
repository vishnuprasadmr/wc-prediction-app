/**
 * OAuth redirect base URL.
 * Prefer VITE_APP_URL on Netlify/production builds; fall back to current browser origin.
 */
export function getAppOrigin(): string {
  const configured = (import.meta.env.VITE_APP_URL as string | undefined)?.trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
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
