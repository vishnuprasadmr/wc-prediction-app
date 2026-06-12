import { motion, AnimatePresence } from 'framer-motion'
import { usePwaInstall } from '../hooks/usePwaInstall'

export function InstallPrompt() {
  const { canInstallNatively, showPrompt, install, dismiss, instructions } = usePwaInstall()

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 mx-auto max-w-lg"
        >
          <div className="rounded-2xl border border-default bg-card p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-simelabs/20 text-xl">
                📲
              </div>
              <div className="flex-1">
                <p className="font-semibold">Install the app</p>
                <p className="mt-0.5 text-sm text-pretty text-muted">{instructions}</p>
                <div className="mt-3 flex gap-2">
                  {canInstallNatively && (
                    <button
                      type="button"
                      onClick={() => void install()}
                      className="rounded-lg bg-simelabs px-4 py-1.5 text-sm font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark"
                    >
                      Install
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={dismiss}
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
