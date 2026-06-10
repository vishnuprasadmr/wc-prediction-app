import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const dismissedBefore = localStorage.getItem('pwa-install-dismissed')
    if (dismissedBefore) setDismissed(true)

    const ua = window.navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', '1')
  }

  const showBanner = !dismissed && (deferredPrompt || isIOS)

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 mx-auto max-w-lg"
        >
          <div className="rounded-2xl border border-default bg-card p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-simelabs/20 text-xl">
                📲
              </div>
              <div className="flex-1">
                <p className="font-semibold">Install the app</p>
                <p className="mt-0.5 text-sm text-muted">
                  {isIOS && !deferredPrompt
                    ? 'Tap Share → Add to Home Screen for quick access.'
                    : 'Add to your home screen for the best experience.'}
                </p>
                <div className="mt-3 flex gap-2">
                  {deferredPrompt && (
                    <button
                      onClick={handleInstall}
                      className="rounded-lg bg-simelabs px-4 py-1.5 text-sm font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark"
                    >
                      Install
                    </button>
                  )}
                  <button
                    onClick={handleDismiss}
                    className="rounded-lg px-4 py-1.5 text-sm text-muted transition hover:text-theme"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
