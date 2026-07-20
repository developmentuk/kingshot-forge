import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import type { PlayerAccount } from '../types/playerAccount'
import { normalizeTownCenterLevel } from '../services/playerProgressionService'

const REFRESH_STALE_MS = 30 * 60 * 1000
const REFRESH_THROTTLE_MS = 5 * 60 * 1000
const refreshInFlight = new Map<string, Promise<void>>()
const refreshAttemptAt = new Map<string, number>()

type PlayerIdentityContextValue = {
  playerAccount: PlayerAccount | null
  loadingPlayerAccount: boolean
  playerIdentityError: string | null
  refreshPlayerIdentity: () => Promise<void>
}

const PlayerIdentityContext = createContext<
  PlayerIdentityContextValue | undefined
>(undefined)

type PlayerIdentityProviderProps = {
  children: ReactNode
}

export function PlayerIdentityProvider({
  children,
}: PlayerIdentityProviderProps) {
  const { user, session, loading: authLoading } = useAuth()

  const [playerAccount, setPlayerAccount] =
    useState<PlayerAccount | null>(null)

  const [loadingPlayerAccount, setLoadingPlayerAccount] =
    useState(true)
  const [playerIdentityError, setPlayerIdentityError] =
    useState<string | null>(null)

  const loadPlayerIdentity = useCallback(async () => {
    if (!user) {
      setPlayerAccount(null)
      setPlayerIdentityError(null)
      setLoadingPlayerAccount(false)
      return
    }

    setLoadingPlayerAccount(true)
    setPlayerIdentityError(null)

    const { data, error } = await supabase
      .from('player_accounts')
      .select(
        `
          id,
          user_id,
          player_id,
          player_name,
          kingdom_id,
          player_level,
          level_rendered,
          level_rendered_detailed,
          level_image,
          profile_photo,
          verification_status,
          verification_method,
          verified_by,
          verified_at,
          last_refreshed_at,
          is_primary,
          is_public,
          created_at,
          updated_at
        `,
      )
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()

    if (error) {
      console.error(
        'Unable to load linked Kingshot identity:',
        error.message,
      )

      setPlayerAccount(null)
      setPlayerIdentityError(
        'Your linked player could not be loaded. Please try again.',
      )
      setLoadingPlayerAccount(false)
      return
    }

    const account = data ? { ...(data as PlayerAccount), town_center_level: normalizeTownCenterLevel((data as PlayerAccount).town_center_level, (data as PlayerAccount).level_rendered_detailed, (data as PlayerAccount).level_rendered) } : null
    setPlayerAccount(account)

    setLoadingPlayerAccount(false)
  }, [user])

  const refreshPlayerIdentity = useCallback(async () => {
    if (!user || !session?.access_token) return loadPlayerIdentity()
    const existing = refreshInFlight.get(user.id)
    if (existing) return existing
    const request = (async () => {
      setLoadingPlayerAccount(true)
      setPlayerIdentityError(null)
      try {
        const response = await fetch('/api/player/account', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'revalidate' }) })
        const payload = await response.json().catch(() => null) as { status?: string; message?: string } | null
        if (!response.ok || payload?.status !== 'success') throw new Error(payload?.message ?? 'Player data could not be refreshed.')
        refreshAttemptAt.set(user.id, Date.now())
      } catch (caught) {
        setPlayerIdentityError(caught instanceof Error ? `Cached player data is being used. ${caught.message}` : 'Cached player data is being used while refresh is unavailable.')
      } finally {
        await loadPlayerIdentity()
      }
    })().finally(() => refreshInFlight.delete(user.id))
    refreshInFlight.set(user.id, request)
    return request
  }, [loadPlayerIdentity, session?.access_token, user])

  useEffect(() => {
    if (authLoading) {
      return
    }

    let cancelled = false
    async function establish() {
      if (!user) { await loadPlayerIdentity(); return }
      const lastRefresh = Date.parse(playerAccount?.last_refreshed_at ?? '')
      const throttled = Date.now() - (refreshAttemptAt.get(user.id) ?? 0) < REFRESH_THROTTLE_MS
      const stale = !Number.isFinite(lastRefresh) || Date.now() - lastRefresh > REFRESH_STALE_MS
      if (!cancelled && session?.access_token && (stale || !refreshAttemptAt.has(user.id)) && !throttled) await refreshPlayerIdentity()
      else if (!cancelled) await loadPlayerIdentity()
    }
    void establish()
    return () => { cancelled = true }
  }, [authLoading, loadPlayerIdentity, playerAccount?.last_refreshed_at, refreshPlayerIdentity, session?.access_token, user])

  useEffect(() => {
    if (!session?.access_token || !user) return
    void fetch('/api/giftcodes?action=auto-run', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: '{}' }).catch(() => undefined)
  }, [session?.access_token, user])

  useEffect(() => {
    function handlePlayerUpdate() {
      void refreshPlayerIdentity()
    }

    window.addEventListener(
      'kingshot-player-updated',
      handlePlayerUpdate,
    )

    return () => {
      window.removeEventListener(
        'kingshot-player-updated',
        handlePlayerUpdate,
      )
    }
  }, [refreshPlayerIdentity])

  const value =
    useMemo<PlayerIdentityContextValue>(
      () => ({
        playerAccount,
        loadingPlayerAccount,
        playerIdentityError,
        refreshPlayerIdentity,
      }),
      [
        playerAccount,
        loadingPlayerAccount,
        playerIdentityError,
        refreshPlayerIdentity,
      ],
    )

  return (
    <PlayerIdentityContext.Provider value={value}>
      {children}
    </PlayerIdentityContext.Provider>
  )
}

export function usePlayerIdentity() {
  const context = useContext(PlayerIdentityContext)

  if (!context) {
    throw new Error(
      'usePlayerIdentity must be used inside a PlayerIdentityProvider.',
    )
  }

  return context
}
