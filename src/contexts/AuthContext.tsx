import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

const AUTH_INIT_TIMEOUT_MS = 8_000
const PROFILE_FETCH_TIMEOUT_MS = 10_000
const OAUTH_SETTLE_TIMEOUT_MS = 10_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        window.clearTimeout(timer)
        reject(err)
      })
  })
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  /** True while league profile is being fetched for the signed-in user */
  profileLoading: boolean
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
  const [profileLoading, setProfileLoading] = useState(false)
  const [oauthSettling, setOauthSettling] = useState(() => isOAuthCallback())
  const profileRequestRef = useRef(0)

  const loadProfile = useCallback(async (authUser: User) => {
    await ensureUserProfile(authUser)

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

  const fetchProfile = useCallback(
    async (authUser: User) => {
      const requestId = ++profileRequestRef.current
      setProfileLoading(true)

      try {
        await withTimeout(loadProfile(authUser), PROFILE_FETCH_TIMEOUT_MS, 'Profile fetch')
      } catch (err) {
        console.error('Profile load failed:', err)
        setProfile(null)
      } finally {
        if (requestId === profileRequestRef.current) {
          setProfileLoading(false)
        }
      }
    },
    [loadProfile],
  )

  const handleSignedInUser = useCallback(
    async (event: string, authUser: User) => {
      const allowed = await enforceGoogleOnlyAuth(authUser)
      if (!allowed) {
        setProfile(null)
        setProfileLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        try {
          await withTimeout(completeGoogleAuth(authUser), PROFILE_FETCH_TIMEOUT_MS, 'Google auth')
        } catch (err) {
          console.warn('Google auth completion failed:', err)
        }
      }

      await fetchProfile(authUser)
    },
    [fetchProfile],
  )

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user)
    }
  }, [session?.user, fetchProfile])

  useEffect(() => {
    let cancelled = false
    let authReady = false

    const markAuthReady = (nextSession: Session | null) => {
      if (cancelled || authReady) return
      authReady = true
      setSession(nextSession)
      setLoading(false)
      setOauthSettling(false)
    }

    const oauthRedirectError = consumeOAuthRedirectError()
    if (oauthRedirectError) {
      setAuthError(oauthRedirectError)
      setOauthSettling(false)
    }

    const settleTimeout = window.setTimeout(() => {
      if (!cancelled) setOauthSettling(false)
    }, OAUTH_SETTLE_TIMEOUT_MS)

    const initTimeout = window.setTimeout(() => {
      if (!cancelled) markAuthReady(null)
    }, AUTH_INIT_TIMEOUT_MS)

    void (async () => {
      try {
        const { data: { session: existing } } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_INIT_TIMEOUT_MS,
          'Auth init',
        )
        if (cancelled) return

        if (!existing && isOAuthCallback()) {
          clearOAuthUrl()
          setAuthError('Sign-in could not be completed. Please use Sign in with Google.')
        }

        markAuthReady(existing)
        if (existing?.user) {
          void handleSignedInUser('INITIAL_SESSION', existing.user)
        }
      } catch (err) {
        console.warn('Auth init failed:', err)
        if (!cancelled) markAuthReady(null)
      } finally {
        window.clearTimeout(initTimeout)
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (cancelled) return

      setSession(nextSession)
      setOauthSettling(false)
      markAuthReady(nextSession)

      if (!nextSession?.user) {
        profileRequestRef.current += 1
        setProfile(null)
        setProfileLoading(false)
        return
      }

      // Never await inside onAuthStateChange — Supabase can deadlock; defer work.
      void handleSignedInUser(event, nextSession.user)
    })

    const resumeSession = () => {
      void withTimeout(supabase.auth.getSession(), AUTH_INIT_TIMEOUT_MS, 'Session resume')
        .then(({ data: { session: resumed } }) => {
          if (cancelled) return
          setSession(resumed)
          setLoading(false)
          if (resumed?.user) {
            void handleSignedInUser('INITIAL_SESSION', resumed.user)
          } else {
            profileRequestRef.current += 1
            setProfile(null)
            setProfileLoading(false)
          }
        })
        .catch((err) => {
          console.warn('Session resume failed:', err)
          if (!cancelled) {
            setLoading(false)
            setProfileLoading(false)
          }
        })
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') resumeSession()
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) resumeSession()
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      cancelled = true
      window.clearTimeout(settleTimeout)
      window.clearTimeout(initTimeout)
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [handleSignedInUser])

  const signInGoogle = useCallback(async () => {
    await signInWithGoogle('/login')
  }, [])

  const signUpGoogle = useCallback(async () => {
    startGoogleRegistration()
    await signInWithGoogle('/register')
  }, [])

  const completeUserProfileFn = useCallback(
    async (displayName: string, employeeId?: string | null) => {
      if (!session?.user) {
        throw new Error('You must be signed in to complete registration.')
      }
      await completeUserProfile(session.user, displayName, employeeId)
      await fetchProfile(session.user)
    },
    [session?.user, fetchProfile],
  )

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
    setProfileLoading(false)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
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
      profileLoading,
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
