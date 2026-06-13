import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { AuthLoadingScreen } from '../components/AuthLoadingScreen'
import { hasLeagueProfile } from '../lib/employeeId'
import { consumeAuthError } from '../lib/authOAuth'

export function LoginPage() {
  const { signInGoogle, session, profile, loading, oauthSettling } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const oauthError = consumeAuthError()
    if (oauthError) setError(oauthError)
  }, [])

  if (loading || oauthSettling) {
    return (
      <AuthLoadingScreen
        message={oauthSettling ? 'Signing you in...' : 'Loading...'}
      />
    )
  }

  if (session && hasLeagueProfile(profile)) return <Navigate to="/" replace />

  if (session && !hasLeagueProfile(profile)) {
    return <Navigate to="/register" replace />
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await signInGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="page-shell flex min-h-dvh flex-col items-center justify-center px-4 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-content w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-simelabs to-simelabs-dark text-2xl font-bold text-simelabs-foreground shadow-glow">
            WC
          </div>
          <h1 className="type-display">Welcome back</h1>
          <p className="type-body-sm mt-2 text-muted">
            WC 2026 Prediction League — open to everyone
          </p>
          <p className="type-caption mt-2 text-pretty text-muted">
            Sign in with your Google account
          </p>
        </div>

        <GoogleSignInButton
          onClick={() => void handleGoogle()}
          loading={googleLoading}
          label="Sign in with Google"
        />

        {error && (
          <p className="mt-4 text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="font-semibold text-simelabs hover:underline">
            Join with Google
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
