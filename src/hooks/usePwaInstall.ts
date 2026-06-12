import { useCallback, useEffect, useState } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectPlatform() {
  const ua = window.navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
  const isAndroid = /Android/i.test(ua)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true

  return { isIOS, isAndroid, isStandalone }
}

const DISMISS_KEY = 'pwa-install-dismissed'

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [platform, setPlatform] = useState({
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
  })

  useEffect(() => {
    setPlatform(detectPlatform())

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const canInstallNatively = Boolean(deferredPrompt)
  const showPrompt =
    !dismissed && !platform.isStandalone && (canInstallNatively || platform.isIOS || platform.isAndroid)

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      return true
    }
    return false
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, '1')
  }, [])

  const instructions = platform.isIOS
    ? 'Tap Share → Add to Home Screen for quick access.'
    : platform.isAndroid && !canInstallNatively
      ? 'Tap ⋮ (menu) → Install app or Add to Home screen. Chrome may need a second visit before the option appears.'
      : 'Add to your home screen for the best experience — picks, scores, and leaderboard in one tap.'

  return {
    canInstallNatively,
    showPrompt,
    install,
    dismiss,
    instructions,
    isStandalone: platform.isStandalone,
    isIOS: platform.isIOS,
    isAndroid: platform.isAndroid,
  }
}
