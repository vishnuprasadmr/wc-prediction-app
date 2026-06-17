import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { AuthLoadingScreen } from '../components/AuthLoadingScreen'
import { ProfileAvatar } from '../components/ProfileAvatar'
import {
  EMPLOYEE_ID_PLACEHOLDER,
  hasLeagueProfile,
  validateEmployeeId,
} from '../lib/employeeId'
import { isGoogleUser } from '../lib/authGoogle'
import { consumeAuthError, displayNameFromUser } from '../lib/authOAuth'
import { resolveUserAvatarUrl } from '../lib/avatarUrl'

export function RegisterPage() {
  const {
    signUpGoogle,
    completeUserProfile,
    session,
    profile,
    user,
    loading,
    profileLoading,
    oauthSettling,
    signOut,
  } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const completingProfile = Boolean(session && !hasLeagueProfile(profile))

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
    (employeeId.trim() === '' || employeeIdCheck?.valid === true)

  if (loading || oauthSettling || (session && profileLoading)) {
    return (
      <AuthLoadingScreen
        message={oauthSettling ? 'Connecting your Google account...' : 'Loading...'}
      />
    )
  }

  if (session && user && !isGoogleUser(user)) {
    return (
      <div className="page-shell flex min-h-dvh flex-col items-center justify-center px-4 safe-top safe-bottom">
        <div className="page-content w-full max-w-sm text-center">
          <p className="type-display">Google sign-in only</p>
          <p className="type-body-sm mt-2 text-muted text-pretty">
            Sign in with any Google account to join the league.
          </p>
          {error && (
            <p className="mt-4 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => void signOut().then(() => setError(null))}
            className="btn-primary mt-6 w-full"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  if (session && hasLeagueProfile(profile)) return <Navigate to="/" replace />

  const handleComplete = async () => {
    if (!registerReady) {
      setError(employeeIdError ?? 'Enter your display name.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await completeUserProfile(displayName, employeeId.trim() || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile')
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
              Pick a display name to join. Simelabs staff can add an SML ID to unlock the company point table.
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
              <label className="type-label mb-1.5 block">
                Simelabs Employee ID <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                type="text"
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
                  Simelabs employees only — format SML + number (e.g. SML 457)
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
            Open to everyone — continue with Google
          </p>
          <p className="type-caption mt-2 text-muted">
            You&apos;ll pick a display name after signing in
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
