import { useState, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { shouldShowSplash } from '../lib/splash'
import { WelcomeSplash } from './WelcomeSplash'

export function SplashGate({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(() => shouldShowSplash())

  return (
    <>
      {/* Keep app mounted behind splash so data loads without a post-splash loader flash */}
      {children}
      <AnimatePresence>
        {showSplash && (
          <WelcomeSplash key="welcome-splash" onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
