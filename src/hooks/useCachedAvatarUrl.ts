import { useEffect, useState } from 'react'
import { getCachedAvatarUrlSync, resolveCachedAvatarUrl } from '../lib/avatarCache'

/** Avatar URL backed by a 24h local cache — avoids hitting Google on every render. */
export function useCachedAvatarUrl(remoteUrl: string | null | undefined): string | null {
  const [src, setSrc] = useState<string | null>(() => getCachedAvatarUrlSync(remoteUrl))

  useEffect(() => {
    if (!remoteUrl) {
      setSrc(null)
      return
    }

    const cached = getCachedAvatarUrlSync(remoteUrl)
    if (cached) {
      setSrc(cached)
      return
    }

    let cancelled = false
    void resolveCachedAvatarUrl(remoteUrl).then((next) => {
      if (!cancelled) setSrc(next)
    })

    return () => {
      cancelled = true
    }
  }, [remoteUrl])

  return src
}
