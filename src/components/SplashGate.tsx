import { useState, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { hasSeenSplash } from '../lib/splash'
import { WelcomeSplash } from './WelcomeSplash'

export function SplashGate({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(() => !hasSeenSplash())

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <WelcomeSplash key="welcome-splash" onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>
      {!showSplash && children}
    </>
  )
}
