import type { User } from '@supabase/supabase-js'

export const AUTH_ERROR_KEY = 'wc-auth-error'

/** Optional: restrict OAuth sign-in to this email domain (e.g. simelabs.com) */
export const ALLOWED_EMAIL_DOMAIN = (
  import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN as string | undefined
)?.toLowerCase()

export function isAllowedWorkEmail(email: string | undefined): boolean {
  if (!email) return false
  if (!ALLOWED_EMAIL_DOMAIN) return true
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)
}

export function isOAuthCallback(): boolean {
  const hash = window.location.hash
  const search = window.location.search
  return (
    hash.includes('access_token=') ||
    hash.includes('error=') ||
    hash.includes('error_description=') ||
    search.includes('code=')
  )
}

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

  const cleanUrl = window.location.pathname + window.location.hash.split('?')[0]
  window.history.replaceState({}, '', cleanUrl)

  return decodeURIComponent(raw.replace(/\+/g, ' '))
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
