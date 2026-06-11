import { useEffect, useMemo, useState } from 'react'
import {
  formatLockCountdown,
  formatLockCountdownLive,
  getMsUntilPredictionLock,
  isLockWarningWindow,
} from '../lib/matchUtils'

export function useLockCountdown(
  kickoffAt: string | null | undefined,
  options?: { live?: boolean },
) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!kickoffAt) return undefined
    if (getMsUntilPredictionLock(kickoffAt) <= 0) return undefined

    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [kickoffAt])

  return useMemo(() => {
    if (!kickoffAt) {
      return {
        label: null as string | null,
        msUntilLock: 0,
        urgent: false,
        locked: true,
      }
    }

    const msUntilLock = getMsUntilPredictionLock(kickoffAt)
    const locked = msUntilLock <= 0

    const format = options?.live ? formatLockCountdownLive : formatLockCountdown

    return {
      label: locked ? null : format(kickoffAt),
      msUntilLock,
      urgent: !locked && isLockWarningWindow(kickoffAt),
      locked,
    }
  }, [kickoffAt, tick, options?.live])
}
