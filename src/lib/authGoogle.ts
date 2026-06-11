import { LEAGUE_ID, supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import {
  ALLOWED_EMAIL_DOMAIN,
  displayNameFromUser,
  hasOAuthCompleteLock,
  isAllowedWorkEmail,
  AUTH_ERROR_KEY,
  setAuthError,
  setOAuthCompleteLock,
} from './authOAuth'
import { resolveUserAvatarUrl } from './avatarUrl'
import { syncProfileAvatar } from './ensureProfile'
import {
  isEmployeeIdTakenByOther,
  validateEmployeeId,
} from './employeeId'

const PENDING_EMPLOYEE_ID_KEY = 'wc-google-employee-id'
const PENDING_NAME_KEY = 'wc-google-display-name'
const REGISTER_FLOW_KEY = 'wc-google-register-flow'

const GOOGLE_HD = (
  import.meta.env.VITE_GOOGLE_HD as string | undefined
)?.toLowerCase() ?? ALLOWED_EMAIL_DOMAIN

function pendingStore() {
  return localStorage
}

export function isGoogleUser(user: User): boolean {
  return (
    user.app_metadata?.provider === 'google' ||
    Boolean(user.identities?.some((id) => id.provider === 'google'))
  )
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
      redirectTo: `${window.location.origin}${redirectPath}`,
      queryParams: {
        ...(GOOGLE_HD ? { hd: GOOGLE_HD } : {}),
        prompt: 'select_account',
      },
    },
  })
  if (error) throw error
}

async function hasVerifiedEmployeeProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('employee_id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to check employee profile:', error.message)
    return false
  }

  if (!data?.employee_id) return false
  return validateEmployeeId(data.employee_id).valid
}

async function createGoogleProfile(
  user: User,
  displayName: string | undefined,
  employeeId: string,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('employee_id, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (existing?.employee_id && validateEmployeeId(existing.employee_id).valid) {
    await syncProfileAvatar(user, existing.avatar_url)
    return true
  }

  if (await isEmployeeIdTakenByOther(employeeId, user.id)) {
    setAuthError('This employee ID is already registered.')
    return false
  }

  const name = displayNameFromUser(user, displayName)
  const avatarUrl = resolveUserAvatarUrl(user)
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: name,
    league_id: LEAGUE_ID,
    is_admin: false,
    employee_id: employeeId,
    avatar_url: avatarUrl,
  })

  if (error) {
    console.error('Failed to create profile:', error.message)
    if (error.code === '23505') {
      setAuthError('This employee ID is already registered.')
    }
    return false
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      display_name: name,
      employee_id: employeeId,
      league_id: LEAGUE_ID,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    },
  })

  if (metaError) {
    console.warn('Could not update auth metadata:', metaError.message)
  }

  return true
}

export async function completeGoogleAuth(user: User): Promise<void> {
  if (!isGoogleUser(user)) return
  if (hasOAuthCompleteLock('google', user.id)) return

  const store = pendingStore()
  const fromRegister = store.getItem(REGISTER_FLOW_KEY) === '1'
  const pendingEmployeeId = store.getItem(PENDING_EMPLOYEE_ID_KEY)
  const pendingName = store.getItem(PENDING_NAME_KEY)

  if (!isAllowedWorkEmail(user.email)) {
    setAuthError(
      ALLOWED_EMAIL_DOMAIN
        ? `Use your @${ALLOWED_EMAIL_DOMAIN} Google account.`
        : 'This Google account is not allowed.',
    )
    await supabase.auth.signOut()
    return
  }

  if (fromRegister) {
    if (!pendingEmployeeId) {
      // Google first — SML ID collected on register page after OAuth
      return
    }

    const parsed = validateEmployeeId(pendingEmployeeId)
    if (!parsed.valid) {
      setAuthError(parsed.message)
      return
    }

    const ok = await createGoogleProfile(user, pendingName ?? undefined, parsed.normalized)
    if (!ok) {
      if (!sessionStorage.getItem(AUTH_ERROR_KEY)) {
        setAuthError('Could not create your league profile. Please try again.')
      }
      return
    }

    clearPendingGoogleRegistration()
    setOAuthCompleteLock('google', user.id)
    return
  }

  if (!(await hasVerifiedEmployeeProfile(user.id))) {
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
