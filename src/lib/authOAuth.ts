import type { User } from '@supabase/supabase-js'

export const AUTH_ERROR_KEY = 'wc-auth-error'

/** True while Supabase is completing a successful OAuth redirect (tokens in URL). */
export function isOAuthCallback(): boolean {
  const hash = window.location.hash
  const search = window.location.search
  return (
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    search.includes('code=')
  )
}

export function clearOAuthUrl(): void {
  window.history.replaceState({}, '', window.location.pathname)
}

export function humanizeOAuthError(raw: string): string {
  const code = raw.trim().toLowerCase().replace(/\s+/g, '_')
  if (code === 'access_denied' || code.includes('access_denied')) {
    return 'Sign-in was cancelled. You can try again when you’re ready.'
  }
  if (code === 'interaction_required' || code === 'login_required') {
    return 'Sign-in was not completed. Please use the Sign in with Google button.'
  }
  if (code === 'server_error' || code.includes('server_error')) {
    return 'Sign-in failed on the server. Please try again with Google.'
  }
  if (code === 'invalid_request') {
    return 'Sign-in request was invalid. Please use the Sign in with Google button.'
  }
  return raw
}

export const GOOGLE_ONLY_MESSAGE =
  'Sign-in is only supported with Google. Please use the Sign in with Google button.'

export function consumeAuthError(): string | null {
  const redirect = consumeOAuthRedirectError()
  if (redirect) return redirect

  const msg = sessionStorage.getItem(AUTH_ERROR_KEY)
  if (msg) sessionStorage.removeItem(AUTH_ERROR_KEY)
  return msg
}

export function consumeOAuthRedirectError(): string | null {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const raw =
    search.get('error_description') ||
    hash.get('error_description') ||
    search.get('error') ||
    hash.get('error')

  if (!raw) return null

  // Strip OAuth hash/query params — hash errors use `&` (e.g. #error=access_denied&sb=)
  clearOAuthUrl()

  return humanizeOAuthError(decodeURIComponent(raw.replace(/\+/g, ' ')))
}

export function setAuthError(message: string) {
  sessionStorage.setItem(AUTH_ERROR_KEY, message)
}

export function displayNameFromUser(user: User, fallback?: string): string {
  const meta = user.user_metadata ?? {}
  const fromMeta =
    (typeof meta.display_name === 'string' && meta.display_name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name)
  if (fromMeta) return fromMeta.trim()
  if (fallback?.trim()) return fallback.trim()
  if (user.email) return user.email.split('@')[0] ?? 'Player'
  return 'Player'
}

export function isRecentlyCreated(user: User, windowMs = 90_000): boolean {
  const created = new Date(user.created_at).getTime()
  return Date.now() - created < windowMs
}

export function oauthCompleteLockKey(provider: string, userId: string): string {
  return `wc-${provider}-complete-${userId}`
}

export function hasOAuthCompleteLock(provider: string, userId: string): boolean {
  return Boolean(sessionStorage.getItem(oauthCompleteLockKey(provider, userId)))
}

export function setOAuthCompleteLock(provider: string, userId: string): void {
  sessionStorage.setItem(oauthCompleteLockKey(provider, userId), '1')
}
