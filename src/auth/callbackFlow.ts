import type { Session } from '@supabase/supabase-js'
import { resolveInternalDestination } from './returnDestination'

export type CallbackFlowResult = { destination: string; session: Session | null }

export async function completeAuthCallback(options: {
  search: string
  existingSession: Session | null
  exchangeCode: (code: string) => Promise<Session | null>
  onExchangedSession?: (session: Session) => void
}): Promise<CallbackFlowResult> {
  const params = new URLSearchParams(options.search)
  const destination = resolveInternalDestination(params.get('returnTo')).destination

  const notifyExchangedSession = (session: Session | null) => {
    if (!session || !options.onExchangedSession) return
    try {
      options.onExchangedSession(session)
    } catch {
      // Sign-in completion must never be blocked by optional post-auth work.
    }
  }

  if (options.existingSession) {
    return { destination, session: options.existingSession }
  }
  if (params.get('error')) throw { code: params.get('error') === 'access_denied' ? 'access_denied' : 'exchange' }

  const code = params.get('code')
  if (!code) throw { code: 'missing_code' }
  const session = await options.exchangeCode(code)
  notifyExchangedSession(session)
  return { destination, session }
}
