import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export function RegisterPage() {
  const { signUp, session, loading } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signUp(email, password, displayName, inviteCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
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
          <h1 className="type-display">Join the League</h1>
          <p className="type-body-sm mt-2 text-muted text-pretty">
            Enter your Simelabs invite code to register
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="type-label mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@simelabs.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="type-label mb-1.5 block">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Min 6 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="type-label mb-1.5 block">Invite Code</label>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="input-field font-mono uppercase tracking-wide"
              placeholder="SIMELABS-WC26"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-simelabs hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
