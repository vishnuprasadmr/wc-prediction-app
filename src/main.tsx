import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { EnvGuard } from './components/EnvGuard'
import { SplashGate } from './components/SplashGate'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { captureReferralFromUrl } from './lib/referral'
import { installSoundUnlock } from './lib/sounds'
import './index.css'

installSoundUnlock()
captureReferralFromUrl()

try {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000)
      }
    },
  })
} catch (error) {
  console.warn('Service worker registration skipped:', error)
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found')
}

createRoot(root).render(
  <StrictMode>
    <EnvGuard>
      <BrowserRouter>
        <AuthProvider>
        <ThemeProvider>
          <SplashGate>
            <App />
          </SplashGate>
        </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </EnvGuard>
  </StrictMode>,
)
