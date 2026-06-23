import { useEffect } from 'react'

/** Keep Arena duel state fresh while the game screen is open. */
export function useShootoutGameSync(
  open: boolean,
  challengeId: string,
  status: string,
  onSync: () => void,
) {
  useEffect(() => {
    if (!open || status !== 'active') return

    onSync()
    const pollId = window.setInterval(onSync, 3000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') onSync()
    }
    const onFocus = () => onSync()

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)

    return () => {
      window.clearInterval(pollId)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [open, challengeId, status, onSync])
}
