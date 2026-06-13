import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AuthLoadingScreen } from './AuthLoadingScreen'
import { hasLeagueProfile } from '../lib/employeeId'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return <AuthLoadingScreen message="Loading..." />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!hasLeagueProfile(profile)) {
    return <Navigate to="/register" replace />
  }

  return <>{children}</>
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return <AuthLoadingScreen />
  }

  if (!profile?.is_admin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
