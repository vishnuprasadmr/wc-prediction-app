import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLeaguePrizes } from '../hooks/useLeaguePrizes'
import { AuthLoadingScreen } from './AuthLoadingScreen'

export function PrizesRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const { config, loading } = useLeaguePrizes()
  const isAdmin = Boolean(profile?.is_admin)

  if (loading) {
    return <AuthLoadingScreen message="Loading prizes…" />
  }

  if (!config?.published && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
