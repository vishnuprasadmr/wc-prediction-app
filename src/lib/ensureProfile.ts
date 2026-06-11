import type { User } from '@supabase/supabase-js'
import { resolveUserAvatarUrl } from './avatarUrl'
import { clearPendingGoogleRegistration } from './authGoogle'
import { displayNameFromUser, setOAuthCompleteLock } from './authOAuth'
import {
  assertEmployeeIdAvailableForUser,
  validateEmployeeId,
} from './employeeId'
import { LEAGUE_ID, supabase } from './supabase'

export async function syncProfileAvatar(
  user: User,
  currentAvatarUrl?: string | null,
): Promise<string | null> {
  const next = resolveUserAvatarUrl(user)
  if (!next || next === currentAvatarUrl) {
    return currentAvatarUrl ?? null
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: next })
    .eq('id', user.id)

  if (error) {
    console.warn('Failed to sync profile avatar:', error.message)
    return currentAvatarUrl ?? null
  }

  return next
}

export async function completeEmployeeProfile(
  user: User,
  displayName: string,
  employeeId: string,
): Promise<void> {
  const trimmedName = displayName.trim()
  if (!trimmedName) {
    throw new Error('Display name is required.')
  }

  const normalizedEmployeeId = await assertEmployeeIdAvailableForUser(employeeId, user.id)

  const avatarUrl = resolveUserAvatarUrl(user)

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: trimmedName,
    league_id: LEAGUE_ID,
    is_admin: false,
    employee_id: normalizedEmployeeId,
    avatar_url: avatarUrl,
  })

  if (profileError) {
    if (profileError.code === '23505') {
      throw new Error('This employee ID is already registered.')
    }
    throw new Error(profileError.message || 'Could not save your employee profile.')
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      display_name: trimmedName,
      employee_id: normalizedEmployeeId,
      league_id: LEAGUE_ID,
    },
  })

  if (metaError) {
    console.warn('Could not update auth metadata:', metaError.message)
  }

  clearPendingGoogleRegistration()
  setOAuthCompleteLock('google', user.id)
}

export async function ensureUserProfile(user: User): Promise<void> {
  const { data: existing, error: checkError } = await supabase
    .from('profiles')
    .select('id, employee_id, display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (checkError) {
    throw new Error(checkError.message || 'Could not verify your league profile.')
  }

  const meta = user.user_metadata ?? {}
  const rawEmployeeId =
    (typeof meta.employee_id === 'string' && meta.employee_id) || undefined
  const parsed = rawEmployeeId ? validateEmployeeId(rawEmployeeId) : null

  if (existing?.employee_id && validateEmployeeId(existing.employee_id).valid) {
    await syncProfileAvatar(user, existing.avatar_url)
    return
  }

  if (existing && parsed?.valid) {
    const displayName = displayNameFromUser(
      user,
      existing.display_name ||
        (typeof meta.display_name === 'string' ? meta.display_name : undefined),
    )

    const { error: updateError } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName,
      league_id: LEAGUE_ID,
      is_admin: false,
      employee_id: parsed.normalized,
      avatar_url: resolveUserAvatarUrl(user),
    })

    if (updateError) {
      throw new Error(updateError.message || 'Could not update your employee profile.')
    }
    return
  }

  if (existing) {
    return
  }

  if (!parsed?.valid) {
    return
  }

  const displayName = displayNameFromUser(
    user,
    typeof meta.display_name === 'string' ? meta.display_name : undefined,
  )

  const { error: insertError } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: displayName,
    league_id: LEAGUE_ID,
    is_admin: false,
    employee_id: parsed.normalized,
    avatar_url: resolveUserAvatarUrl(user),
  })

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('This employee ID is already registered to another account.')
    }
    throw new Error(insertError.message || 'Could not create your league profile.')
  }
}

export function formatSupabaseError(err: unknown, fallback: string): Error {
  if (err && typeof err === 'object' && 'message' in err) {
    const code = 'code' in err ? String(err.code) : ''
    const message = String(err.message)

    if (code === '23503' && message.includes('season_predictions')) {
      return new Error(
        'Your league profile is missing. Add your SML ID on the register page, then try again.',
      )
    }

    return new Error(message || fallback)
  }

  if (err instanceof Error) return err
  return new Error(fallback)
}
