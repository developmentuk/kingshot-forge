export type AuthFailureCode =
  | 'cancelled'
  | 'missing_code'
  | 'expired_code'
  | 'reused_code'
  | 'missing_verifier'
  | 'network'
  | 'provider_unavailable'
  | 'configuration'
  | 'exchange'
  | 'unknown'

export type UserFacingAuthError = {
  code: AuthFailureCode
  title: string
  message: string
  retryable: boolean
}

export function resolveAuthError(error: unknown): UserFacingAuthError {
  const source = error as { code?: string; status?: number; message?: string } | null
  const code = source?.code?.toLowerCase() ?? ''
  const message = source?.message?.toLowerCase() ?? ''

  if (code === 'provider_unavailable') return { code: 'provider_unavailable', title: 'Sign-in method unavailable', message: 'This sign-in method is not available in Forge.', retryable: false }
  if (code === 'access_denied' || code === 'user_cancelled' || message.includes('cancel')) return { code: 'cancelled', title: 'Sign-in cancelled', message: 'Sign-in was cancelled. You can try again whenever you are ready.', retryable: true }
  if (code === 'missing_verifier' || message.includes('pkce') || message.includes('verifier')) return { code: 'missing_verifier', title: 'Sign-in could not be completed', message: 'This sign-in attempt expired before it reached Forge. Start again to retry.', retryable: true }
  if (code.includes('expired') || message.includes('expired')) return { code: 'expired_code', title: 'Sign-in link expired', message: 'This sign-in attempt has expired. Start again to retry.', retryable: true }
  if (code.includes('already_used') || code.includes('invalid_grant') || message.includes('already been used')) return { code: 'reused_code', title: 'Sign-in link already used', message: 'This sign-in attempt has already been completed. Start again if you still need access.', retryable: true }
  if (source?.status === 0 || message.includes('network') || message.includes('fetch')) return { code: 'network', title: 'Connection problem', message: 'Forge could not reach the sign-in service. Check your connection and try again.', retryable: true }
  if (code.includes('config') || source?.status === 401 || source?.status === 403) return { code: 'configuration', title: 'Sign-in is temporarily unavailable', message: 'This sign-in method is not configured for this Forge environment.', retryable: false }
  if (code === 'missing_code') return { code: 'missing_code', title: 'Sign-in was not completed', message: 'No completed sign-in was received. Start again to retry.', retryable: true }
  return { code: 'exchange', title: 'Sign-in could not be completed', message: 'Forge could not complete sign-in. Please try again.', retryable: true }
}
