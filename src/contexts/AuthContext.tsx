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
  enforceGoogleOnlyAuth,
  signInWithGoogle,
  startGoogleRegistration,
} from '../lib/authGoogle'
import {
  clearOAuthUrl,
  consumeOAuthRedirectError,
  isOAuthCallback,
  setAuthError,
} from '../lib/authOAuth'
import { completeUserProfile, ensureUserProfile, syncProfileAvatar } from '../lib/ensureProfile'
import type { Profile } from '../lib/types'
import { supabase } from '../lib/supabase'

const OAUTH_SETTLE_TIMEOUT_MS = 10_000

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  /** True while processing an OAuth redirect (tokens in URL) */
  oauthSettling: boolean
  signInGoogle: () => Promise<void>
  signUpGoogle: () => Promise<void>
  completeUserProfile: (displayName: string, employeeId?: string | null) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [oauthSettling, setOauthSettling] = useState(() => isOAuthCallback())

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
    let cancelled = false

    const oauthRedirectError = consumeOAuthRedirectError()
    if (oauthRedirectError) {
      setAuthError(oauthRedirectError)
      setOauthSettling(false)
    }

    const settleTimeout = window.setTimeout(() => {
      if (!cancelled) setOauthSettling(false)
    }, OAUTH_SETTLE_TIMEOUT_MS)

    void (async () => {
      try {
        const { data: { session: existing } } = await supabase.auth.getSession()
        if (cancelled) return

        if (!existing && isOAuthCallback()) {
          clearOAuthUrl()
          setAuthError(
            'Sign-in could not be completed. Please use Sign in with Google.',
          )
          setOauthSettling(false)
        }
      } catch {
        if (!cancelled) setOauthSettling(false)
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s)
      setOauthSettling(false)

      try {
        if (s?.user) {
          const allowed = await enforceGoogleOnlyAuth(s.user)
          if (!allowed) {
            setProfile(null)
            return
          }

          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await completeGoogleAuth(s.user)
          }
          await fetchProfile(s.user)
        } else {
          setProfile(null)
        }
      } finally {
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      window.clearTimeout(settleTimeout)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signInGoogle = useCallback(async () => {
    await signInWithGoogle('/login')
  }, [])

  const signUpGoogle = useCallback(async () => {
    startGoogleRegistration()
    await signInWithGoogle('/register')
  }, [])

  const completeUserProfileFn = useCallback(async (displayName: string, employeeId?: string | null) => {
    if (!session?.user) {
      throw new Error('You must be signed in to complete registration.')
    }
    await completeUserProfile(session.user, displayName, employeeId)
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
      oauthSettling,
      signInGoogle,
      signUpGoogle,
      completeUserProfile: completeUserProfileFn,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      oauthSettling,
      signInGoogle,
      signUpGoogle,
      completeUserProfileFn,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
