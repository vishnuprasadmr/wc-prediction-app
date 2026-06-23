import type { User } from '@supabase/supabase-js'
import { AVATAR_CACHE_TTL_MS } from './avatarCache'
import { resolveUserAvatarUrl } from './avatarUrl'
import { clearPendingGoogleRegistration } from './authGoogle'
import { displayNameFromUser, setOAuthCompleteLock } from './authOAuth'
import {
  assertEmployeeIdAvailableForUser,
  validateEmployeeId,
} from './employeeId'
import { consumeStoredReferral } from './referral'
import { LEAGUE_ID, supabase } from './supabase'

const AVATAR_SYNC_PREFIX = 'wc-avatar-sync:'

function shouldSyncAvatarFromProvider(userId: string): boolean {
  try {
    const raw = localStorage.getItem(`${AVATAR_SYNC_PREFIX}${userId}`)
    if (!raw) return true
    return Date.now() - Number(raw) >= AVATAR_CACHE_TTL_MS
  } catch {
    return true
  }
}

function markAvatarSynced(userId: string): void {
  try {
    localStorage.setItem(`${AVATAR_SYNC_PREFIX}${userId}`, String(Date.now()))
  } catch {
    /* private browsing */
  }
}

export async function syncProfileAvatar(
  user: User,
  currentAvatarUrl?: string | null,
): Promise<string | null> {
  if (!shouldSyncAvatarFromProvider(user.id)) {
    return currentAvatarUrl ?? null
  }

  const next = resolveUserAvatarUrl(user)
  markAvatarSynced(user.id)

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

export async function completeUserProfile(
  user: User,
  displayName: string,
  employeeId?: string | null,
): Promise<void> {
  const trimmedName = displayName.trim()
  if (!trimmedName) {
    throw new Error('Display name is required.')
  }

  let normalizedEmployeeId: string | null = null
  const trimmedId = employeeId?.trim()
  if (trimmedId) {
    normalizedEmployeeId = await assertEmployeeIdAvailableForUser(trimmedId, user.id)
  }

  const avatarUrl = resolveUserAvatarUrl(user)

  let referredBy: string | null = consumeStoredReferral()
  if (referredBy === user.id) {
    referredBy = null
  } else if (referredBy) {
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', referredBy)
      .maybeSingle()

    if (!referrer) {
      referredBy = null
    }
  }

  const profilePayload: Record<string, unknown> = {
    id: user.id,
    display_name: trimmedName,
    league_id: LEAGUE_ID,
    is_admin: false,
    employee_id: normalizedEmployeeId,
    avatar_url: avatarUrl,
  }

  if (referredBy) {
    profilePayload.referred_by = referredBy
  }

  const { error: profileError } = await supabase.from('profiles').upsert(profilePayload)

  if (profileError) {
    if (profileError.code === '23505') {
      throw new Error('This employee ID is already registered.')
    }
    throw new Error(profileError.message || 'Could not save your profile.')
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

/** @deprecated Use completeUserProfile */
export const completeEmployeeProfile = completeUserProfile

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

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        league_id: LEAGUE_ID,
        employee_id: parsed.normalized,
        avatar_url: resolveUserAvatarUrl(user),
      })
      .eq('id', user.id)

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
        'Your league profile is missing. Sign in and set your display name, then try again.',
      )
    }

    return new Error(message || fallback)
  }

  if (err instanceof Error) return err
  return new Error(fallback)
}
