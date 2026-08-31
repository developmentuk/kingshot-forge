import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resolveAuthError, type UserFacingAuthError } from '../auth/authErrors'
import { completeAuthCallback } from '../auth/callbackFlow'
import { exchangeForgeCallbackCode, getCurrentForgeSession } from '../services/authService'
import { syncLinkedPlayerAfterSignIn } from '../services/postSignInPlayerSyncService'
import '../styles/authCallback.css'

type CallbackState = { status: 'loading' } | { status: 'error'; error: UserFacingAuthError }

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const handled = useRef(false)
  const [state, setState] = useState<CallbackState>({ status: 'loading' })

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const callbackSearch = window.location.search

    // Remove code, error, state and all other callback values before any
    // analytics, logging, navigation or user-facing error handling occurs.
    window.history.replaceState({}, document.title, '/auth/callback')

    async function complete() {
      try {
        const current = await getCurrentForgeSession()
        if (current.error) throw current.error
        const result = await completeAuthCallback({
          search: callbackSearch,
          existingSession: current.data.session,
          exchangeCode: exchangeForgeCallbackCode,
          onExchangedSession: (session) => {
            // Only a successfully exchanged OAuth session is a genuine
            // sign-in signal. Prime the idempotent sync before navigation mounts
            // PlayerIdentityContext on an auto-refresh route. The request is
            // intentionally not awaited so provider availability cannot block
            // authentication success.
            void syncLinkedPlayerAfterSignIn(session)
          },
        })
        navigate(result.destination, { replace: true })
      } catch (error) {
        const mapped = resolveAuthError(error)
        setState({ status: 'error', error: mapped })
      }
    }

    void complete()
  }, [navigate])

  if (state.status === 'loading') {
    return <main className="auth-callback" aria-live="polite"><div className="auth-callback__card"><p className="eyebrow">Forge authentication</p><h1>Completing sign-in</h1><p>Securely returning you to Forge…</p><span className="auth-callback__spinner" aria-hidden="true" /></div></main>
  }

  return <main className="auth-callback" aria-live="assertive"><div className="auth-callback__card"><p className="eyebrow">Forge authentication</p><h1>{state.error.title}</h1><p>{state.error.message}</p><div className="auth-callback__actions"><button className="button button--primary" type="button" onClick={() => navigate('/my-forge')}>Return to Forge</button>{state.error.retryable && <Link className="button button--secondary" to="/my-forge">Try again</Link>}</div></div></main>
}
