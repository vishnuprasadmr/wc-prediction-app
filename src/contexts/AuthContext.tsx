import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  completeGoogleAuth,
  signInWithGoogle,
  startGoogleRegistration,
} from '../lib/authGoogle'
import { consumeOAuthRedirectError, setAuthError } from '../lib/authOAuth'
import { completeEmployeeProfile, ensureUserProfile, syncProfileAvatar } from '../lib/ensureProfile'
import type { Profile } from '../lib/types'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signInGoogle: () => Promise<void>
  signUpGoogle: () => Promise<void>
  completeEmployeeProfile: (displayName: string, employeeId: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (authUser: User) => {
    try {
      await ensureUserProfile(authUser)
    } catch (err) {
      console.error('Profile ensure failed:', err)
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch profile:', error.message)
      setProfile(null)
      return
    }

    if (!data) {
      setProfile(null)
      return
    }

    const syncedAvatar = await syncProfileAvatar(authUser, data.avatar_url)
    setProfile({
      ...(data as Profile),
      avatar_url: syncedAvatar ?? data.avatar_url,
    })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user)
    }
  }, [session?.user, fetchProfile])

  useEffect(() => {
    const oauthRedirectError = consumeOAuthRedirectError()
    if (oauthRedirectError) setAuthError(oauthRedirectError)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s)

      if (s?.user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await completeGoogleAuth(s.user)
        }
        await fetchProfile(s.user)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signInGoogle = useCallback(async () => {
    await signInWithGoogle('/login')
  }, [])

  const signUpGoogle = useCallback(async () => {
    startGoogleRegistration()
    await signInWithGoogle('/register')
  }, [])

  const completeEmployeeProfileFn = useCallback(async (displayName: string, employeeId: string) => {
    if (!session?.user) {
      throw new Error('You must be signed in to complete registration.')
    }
    await completeEmployeeProfile(session.user, displayName, employeeId)
    await fetchProfile(session.user)
  }, [session?.user, fetchProfile])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signInGoogle,
      signUpGoogle,
      completeEmployeeProfile: completeEmployeeProfileFn,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signInGoogle, signUpGoogle, completeEmployeeProfileFn, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
