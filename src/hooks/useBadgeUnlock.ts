import { useCallback, useEffect, useRef, useState } from 'react'
import type { Badge } from '../lib/badges'
import { getShownBadgeIds, markBadgeShown } from '../lib/badgeMemory'

interface UseBadgeUnlockOptions {
  ready: boolean
  userId?: string
}

export function useBadgeUnlock(badges: Badge[], { ready, userId }: UseBadgeUnlockOptions) {
  const [unlocking, setUnlocking] = useState<Badge | null>(null)
  const queueRef = useRef<Badge[]>([])

  useEffect(() => {
    if (!ready || !userId) return

    const earnedNow = badges.filter((b) => b.earned)
    const shown = getShownBadgeIds(userId)
    const newlyEarned = earnedNow.filter((b) => !shown.has(b.id))
    if (newlyEarned.length === 0) return

    const alreadyQueued = new Set([
      ...queueRef.current.map((b) => b.id),
      ...(unlocking ? [unlocking.id] : []),
    ])
    const toQueue = newlyEarned.filter((b) => !alreadyQueued.has(b.id))
    if (toQueue.length === 0) return

    queueRef.current = [...queueRef.current, ...toQueue]
    setUnlocking((current) => current ?? queueRef.current[0] ?? null)
  }, [badges, ready, userId, unlocking])

  const dismissUnlock = useCallback(() => {
    if (!userId || !unlocking) {
      setUnlocking(null)
      return
    }

    markBadgeShown(userId, unlocking.id)
    queueRef.current = queueRef.current.filter((b) => b.id !== unlocking.id)
    setUnlocking(queueRef.current[0] ?? null)
  }, [unlocking, userId])

  return { unlocking, dismissUnlock }
}
