const KEY_PREFIX = 'wc-shown-badges'
const LEGACY_KEY = 'wc-earned-badges'

function storageKey(userId: string): string {
  return `${KEY_PREFIX}:${userId}`
}

function readIds(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function writeIds(key: string, ids: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]))
  } catch {
    /* ignore */
  }
}

/** Badges the user has already seen the unlock celebration for. */
export function getShownBadgeIds(userId: string): Set<string> {
  const current = readIds(storageKey(userId))
  if (current.size > 0) return current

  // One-time migration from the old key (same meaning after the loading-state fix).
  const legacy = readIds(LEGACY_KEY)
  if (legacy.size > 0) {
    writeIds(storageKey(userId), legacy)
    localStorage.removeItem(LEGACY_KEY)
    return legacy
  }

  return current
}

export function markBadgeShown(userId: string, badgeId: string): void {
  const shown = getShownBadgeIds(userId)
  shown.add(badgeId)
  writeIds(storageKey(userId), shown)
}
