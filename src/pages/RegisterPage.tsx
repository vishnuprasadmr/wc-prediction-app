import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { AuthLoadingScreen } from '../components/AuthLoadingScreen'
import { ProfileAvatar } from '../components/ProfileAvatar'
import { EMPLOYEE_ID_PLACEHOLDER, isSimelabsEmployee, validateEmployeeId } from '../lib/employeeId'
import { consumeAuthError, displayNameFromUser, isOAuthCallback } from '../lib/authOAuth'
import { resolveUserAvatarUrl } from '../lib/avatarUrl'

export function RegisterPage() {
  const {
    signUpGoogle,
    completeEmployeeProfile,
    session,
    profile,
    user,
    loading,
  } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const completingProfile = Boolean(session && !isSimelabsEmployee(profile))

  useEffect(() => {
    const oauthError = consumeAuthError()
    if (oauthError) setError(oauthError)
  }, [])

  useEffect(() => {
    if (!completingProfile || !user) return
    const suggested = displayNameFromUser(user, profile?.display_name)
    if (suggested && !displayName) {
      setDisplayName(suggested)
    }
  }, [completingProfile, user, profile?.display_name, displayName])

  const employeeIdCheck = employeeId.trim()
    ? validateEmployeeId(employeeId)
    : null
  const employeeIdError =
    employeeIdCheck && !employeeIdCheck.valid ? employeeIdCheck.message : null

  const registerReady =
    displayName.trim().length > 0 &&
    employeeIdCheck?.valid === true

  if (loading || isOAuthCallback()) {
    return (
      <AuthLoadingScreen
        message={isOAuthCallback() ? 'Connecting your Google account...' : 'Loading...'}
      />
    )
  }

  if (session && isSimelabsEmployee(profile)) return <Navigate to="/" replace />

  const handleComplete = async () => {
    if (!registerReady || !employeeIdCheck?.valid) {
      setError(employeeIdError ?? 'Enter a valid employee ID.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await completeEmployeeProfile(displayName, employeeId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save employee ID')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await signUpGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed')
      setGoogleLoading(false)
    }
  }

  if (completingProfile) {
    const avatarUrl = profile?.avatar_url ?? resolveUserAvatarUrl(user)

    return (
      <div className="page-shell flex min-h-dvh flex-col items-center justify-center px-4 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-content w-full max-w-sm"
        >
          <div className="mb-8 text-center">
            <ProfileAvatar
              name={displayName || 'Player'}
              avatarUrl={avatarUrl}
              size="lg"
              className="mx-auto ring-2 ring-simelabs/30"
            />
            <h1 className="type-display mt-4">Welcome!</h1>
            <p className="type-body-sm mt-2 text-muted text-pretty">
              One last step — enter your Simelabs employee ID to join the league
            </p>
            {user?.email && (
              <p className="type-caption mt-2 break-all text-muted">{user.email}</p>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-simelabs/25 bg-simelabs/5 p-4">
            <div>
              <label className="type-label mb-1.5 block">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="type-label mb-1.5 block">Employee ID</label>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                className="input-field font-mono uppercase tracking-wide"
                placeholder={EMPLOYEE_ID_PLACEHOLDER}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(employeeIdError)}
              />
              {employeeIdError ? (
                <p className="type-caption mt-1.5 text-red-400">{employeeIdError}</p>
              ) : (
                <p className="type-caption mt-1.5 text-muted">
                  Format: SML followed by a number from 0 to 1000
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={submitting || !registerReady}
              className="btn-primary w-full"
            >
              {submitting ? 'Joining...' : 'Enter the league ⚽'}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page-shell flex min-h-dvh flex-col items-center justify-center px-4 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-content w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="type-display">Join the League</h1>
          <p className="type-body-sm mt-2 text-muted text-pretty">
            Simelabs employees · continue with Google
          </p>
          <p className="type-caption mt-2 text-muted">
            You&apos;ll add your SML ID right after signing in
          </p>
        </div>

        <GoogleSignInButton
          onClick={() => void handleGoogle()}
          loading={googleLoading}
          label="Continue with Google"
        />

        {error && (
          <p className="mt-4 text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Already joined?{' '}
          <Link to="/login" className="font-semibold text-simelabs hover:underline">
            Sign in with Google
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
