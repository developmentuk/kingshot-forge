import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AuthChangeEvent,
  Session,
  User,
} from '@supabase/supabase-js'
import { beginOAuthAuthentication, getCurrentForgeSession, observeForgeAuthState, signOutForgeUser } from '../services/authService'
import { track } from '../platform/analytics/analytics'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] =
    useState<Session | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const {
        data: { session: currentSession },
        error,
      } = await getCurrentForgeSession()

      if (!isMounted) {
        return
      }

      if (error) {
        console.error(
          'Unable to load Supabase session:',
          error.message,
        )
      }

      setSession(currentSession)
      setLoading(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = observeForgeAuthState(
      (
        _event: AuthChangeEvent,
        nextSession: Session | null,
      ) => {
        if (!isMounted) {
          return
        }

        setSession(nextSession)
        setLoading(false)
        if (nextSession && _event === 'SIGNED_IN') track('login')
        if (_event === 'SIGNED_OUT') track('logout')
      },
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithGoogle() {
    await beginOAuthAuthentication(
      'google',
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    )
  }

  async function signOut() {
    await signOutForgeUser()
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithGoogle,
      signOut,
    }),
    [session, loading],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider.',
    )
  }

  return context
}
