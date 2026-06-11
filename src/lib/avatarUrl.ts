import type { User } from '@supabase/supabase-js'

export function avatarUrlFromUser(user: User | null | undefined): string | null {
  if (!user) return null

  const meta = user.user_metadata ?? {}
  const candidates = [
    meta.avatar_url,
    meta.picture,
    meta.photoURL,
    meta.photo_url,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

export function avatarUrlFromIdentity(user: User | null | undefined): string | null {
  if (!user?.identities?.length) return null

  for (const identity of user.identities) {
    const data = identity.identity_data ?? {}
    const url =
      (typeof data.avatar_url === 'string' && data.avatar_url) ||
      (typeof data.picture === 'string' && data.picture)
    if (url) return url
  }

  return null
}

export function resolveUserAvatarUrl(user: User | null | undefined): string | null {
  return avatarUrlFromUser(user) ?? avatarUrlFromIdentity(user)
}
