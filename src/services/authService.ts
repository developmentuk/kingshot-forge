import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { isForgeAuthProviderAvailable, type ForgeAuthProvider } from '../auth/authConfig'
import { DEFAULT_AUTH_DESTINATION, resolveInternalDestination } from '../auth/returnDestination'

export class ForgeAuthError extends Error {
  code: string
  status?: number

  constructor(code: string, message: string, status?: number) {
    super(message)
    this.name = 'ForgeAuthError'
    this.code = code
    this.status = status
  }
}

export function getCurrentForgeSession(): Promise<{ data: { session: Session | null }; error: Error | null }> {
  return supabase.auth.getSession()
}

export async function getCurrentForgeUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export function observeForgeAuthState(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

export async function beginOAuthAuthentication(provider: ForgeAuthProvider, requestedDestination?: string | null): Promise<void> {
  if (!isForgeAuthProviderAvailable(provider)) throw new ForgeAuthError('provider_unavailable', 'The selected provider is unavailable.')
  const destination = resolveInternalDestination(requestedDestination)
  const callback = new URL('/auth/callback', window.location.origin)
  callback.searchParams.set('returnTo', destination.destination)
  const { error } = await supabase.auth.signInWithOAuth({ provider: provider as 'google' | 'discord' | 'facebook' | 'apple', options: { redirectTo: callback.toString() } })
  if (error) throw new ForgeAuthError('oauth_start', 'Sign-in could not be started.')
}

export async function signOutForgeUser(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new ForgeAuthError('signout', 'Sign-out could not be completed.')
}

export function resolveForgeAuthDestination(value: string | null | undefined): string {
  return resolveInternalDestination(value).destination || DEFAULT_AUTH_DESTINATION
}

export async function exchangeForgeCallbackCode(code: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) throw error
  return data.session
}
