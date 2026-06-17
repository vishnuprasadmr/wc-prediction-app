const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const STORAGE_PREFIX = 'wc-avatar-v1:'

interface CacheEntry {
  dataUrl: string
  expiresAt: number
}

const memory = new Map<string, CacheEntry>()

function storageKey(url: string): string {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    hash = (Math.imul(31, hash) + url.charCodeAt(i)) | 0
  }
  return `${STORAGE_PREFIX}${Math.abs(hash)}`
}

function readStorage(url: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(storageKey(url))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!parsed?.dataUrl || typeof parsed.expiresAt !== 'number') return null
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(storageKey(url))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeStorage(url: string, entry: CacheEntry): void {
  try {
    localStorage.setItem(storageKey(url), JSON.stringify(entry))
  } catch {
    /* quota — memory cache still works */
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function getValidEntry(url: string): CacheEntry | null {
  const mem = memory.get(url)
  if (mem && mem.expiresAt > Date.now()) return mem

  const stored = readStorage(url)
  if (stored) {
    memory.set(url, stored)
    return stored
  }

  return null
}

/** Synchronous read — localStorage + memory only (for instant UI paint). */
export function getCachedAvatarUrlSync(url: string | null | undefined): string | null {
  if (!url) return null
  return getValidEntry(url)?.dataUrl ?? null
}

async function fetchAndStore(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
    if (!response.ok) return null

    const blob = await response.blob()
    const dataUrl = await blobToDataUrl(blob)
    const entry: CacheEntry = { dataUrl, expiresAt: Date.now() + CACHE_TTL_MS }
    memory.set(url, entry)
    writeStorage(url, entry)
    return dataUrl
  } catch {
    return null
  }
}

/** Returns a cached data URL; fetches remote at most once per 24h per URL. */
export async function resolveCachedAvatarUrl(
  url: string | null | undefined,
): Promise<string | null> {
  if (!url) return null

  const hit = getValidEntry(url)
  if (hit) return hit.dataUrl

  return fetchAndStore(url)
}

export function loadImageFromSrc(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Canvas-safe avatar load with 24h cache (avoids repeat Google fetches). */
export async function loadCachedAvatarImage(url: string): Promise<HTMLImageElement | null> {
  const cached = await resolveCachedAvatarUrl(url)
  if (cached) return loadImageFromSrc(cached)

  return loadImageFromSrc(url)
}

export const AVATAR_CACHE_TTL_MS = CACHE_TTL_MS

export function clearAvatarCacheForTests(): void {
  memory.clear()
}
