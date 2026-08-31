import type { Session } from '@supabase/supabase-js'
import { resolveInternalDestination } from './returnDestination'

export type CallbackFlowResult = { destination: string; session: Session | null }

export async function completeAuthCallback(options: {
  search: string
  existingSession: Session | null
  exchangeCode: (code: string) => Promise<Session | null>
  onSessionResolved?: (session: Session) => void
}): Promise<CallbackFlowResult> {
  const params = new URLSearchParams(options.search)
  const destination = resolveInternalDestination(params.get('returnTo')).destination

  const notifySessionResolved = (session: Session | null) => {
    if (!session || !options.onSessionResolved) return
    try {
      options.onSessionResolved(session)
    } catch {
      // Sign-in completion must never be blocked by optional post-auth work.
    }
  }

  if (options.existingSession) {
    notifySessionResolved(options.existingSession)
    return { destination, session: options.existingSession }
  }
  if (params.get('error')) throw { code: params.get('error') === 'access_denied' ? 'access_denied' : 'exchange' }

  const code = params.get('code')
  if (!code) throw { code: 'missing_code' }
  const session = await options.exchangeCode(code)
  notifySessionResolved(session)
  return { destination, session }
}
