import { appAuthRedirect } from './appOrigin'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import {
  GOOGLE_ONLY_MESSAGE,
  hasOAuthCompleteLock,
  setAuthError,
  setOAuthCompleteLock,
} from './authOAuth'
import { syncProfileAvatar } from './ensureProfile'

const PENDING_EMPLOYEE_ID_KEY = 'wc-google-employee-id'
const PENDING_NAME_KEY = 'wc-google-display-name'
const REGISTER_FLOW_KEY = 'wc-google-register-flow'

function pendingStore() {
  return localStorage
}

export function isGoogleUser(user: User): boolean {
  return (
    user.app_metadata?.provider === 'google' ||
    Boolean(user.identities?.some((id) => id.provider === 'google'))
  )
}

function authProviderLabel(user: User): string {
  const provider =
    user.app_metadata?.provider ?? user.identities?.find((id) => id.provider)?.provider
  if (provider === 'email') return 'email'
  if (provider === 'google') return 'google'
  return provider ?? 'another method'
}

/** Reject non-Google sign-in — any Google account (personal or work) is allowed. */
export async function enforceGoogleOnlyAuth(user: User): Promise<boolean> {
  if (!isGoogleUser(user)) {
    const label = authProviderLabel(user)
    setAuthError(
      label === 'email'
        ? 'Email sign-in is not supported. Please use the Sign in with Google button.'
        : GOOGLE_ONLY_MESSAGE,
    )
    await supabase.auth.signOut()
    return false
  }

  return true
}

/** Start register flow — Google first, SML ID collected after OAuth */
export function startGoogleRegistration(): void {
  const store = pendingStore()
  store.setItem(REGISTER_FLOW_KEY, '1')
  store.removeItem(PENDING_NAME_KEY)
  store.removeItem(PENDING_EMPLOYEE_ID_KEY)
}

export function clearPendingGoogleRegistration(): void {
  const store = pendingStore()
  store.removeItem(REGISTER_FLOW_KEY)
  store.removeItem(PENDING_NAME_KEY)
  store.removeItem(PENDING_EMPLOYEE_ID_KEY)
}

export async function signInWithGoogle(redirectPath: '/login' | '/register' = '/login'): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: appAuthRedirect(redirectPath),
      queryParams: {
        prompt: 'select_account',
      },
    },
  })
  if (error) throw error
}

async function hasLeagueProfileRow(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to check league profile:', error.message)
    return false
  }

  return Boolean(data?.display_name?.trim())
}

export async function completeGoogleAuth(user: User): Promise<void> {
  if (!(await enforceGoogleOnlyAuth(user))) return
  if (hasOAuthCompleteLock('google', user.id)) return

  const store = pendingStore()
  const fromRegister = store.getItem(REGISTER_FLOW_KEY) === '1'

  if (fromRegister) {
    // Google first — display name (and optional SML ID) on register page after OAuth
    return
  }

  if (!(await hasLeagueProfileRow(user.id))) {
    startGoogleRegistration()
    return
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle()
  await syncProfileAvatar(user, profileRow?.avatar_url)

  setOAuthCompleteLock('google', user.id)
}
