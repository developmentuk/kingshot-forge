import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import type { PlayerAccount } from '../types/playerAccount'
import { normalizeTownCenterLevel } from '../services/playerProgressionService'
import {
  isPlayerIdentityAutoRefreshRoute,
  PlayerIdentityRefreshCoordinator,
  type PlayerIdentityRefreshFailure,
  type PlayerIdentityRefreshReason,
} from './playerIdentityRefreshPolicy'

const REFRESH_STALE_MS = 30 * 60 * 1000
const REFRESH_THROTTLE_MS = 5 * 60 * 1000
const refreshAttemptAt = new Map<string, number>()
// refreshInFlight is coordinated by PlayerIdentityRefreshCoordinator so the
// existing same-user deduplication contract remains explicit at this boundary.
const refreshCoordinator = new PlayerIdentityRefreshCoordinator()

type PlayerIdentityContextValue = {
  playerAccount: PlayerAccount | null
  loadingPlayerAccount: boolean
  playerIdentityError: string | null
  playerIdentityRefreshWarning: string | null
  refreshPlayerIdentity: (reason?: PlayerIdentityRefreshReason) => Promise<void>
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
  const { pathname } = useLocation()
  const isVisionAcceptanceRoute = pathname === '/admin/vision/account-linking-acceptance'
  const canAutoRefresh = isPlayerIdentityAutoRefreshRoute(pathname)

  const [playerAccount, setPlayerAccount] =
    useState<PlayerAccount | null>(null)

  const [loadingPlayerAccount, setLoadingPlayerAccount] =
    useState(true)
  const [playerIdentityError, setPlayerIdentityError] =
    useState<string | null>(null)
  const [playerIdentityRefreshWarning, setPlayerIdentityRefreshWarning] =
    useState<string | null>(null)

  const loadPlayerIdentity = useCallback(async (): Promise<PlayerAccount | null> => {
    if (isVisionAcceptanceRoute) return null
    if (!user) {
      setPlayerAccount(null)
      setPlayerIdentityError(null)
      setPlayerIdentityRefreshWarning(null)
      setLoadingPlayerAccount(false)
      return null
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
      return null
    }

    const account = data ? { ...(data as PlayerAccount), town_center_level: normalizeTownCenterLevel((data as PlayerAccount).town_center_level, (data as PlayerAccount).level_rendered_detailed, (data as PlayerAccount).level_rendered) } : null
    setPlayerAccount(account)
    if (!account) setPlayerIdentityRefreshWarning(null)

    setLoadingPlayerAccount(false)
    return account
  }, [isVisionAcceptanceRoute, user])

  const refreshPlayerIdentity = useCallback(async (reason: PlayerIdentityRefreshReason = 'manual', knownAccount?: PlayerAccount | null) => {
    if (isVisionAcceptanceRoute) return
    if (!user || !session?.access_token) {
      await loadPlayerIdentity()
      return
    }
    const accountBeforeRefresh = knownAccount ?? await loadPlayerIdentity()
    if (!accountBeforeRefresh) return
    let attempted: boolean
    try {
      attempted = await refreshCoordinator.run(user.id, reason, async () => {
        setLoadingPlayerAccount(true)
        setPlayerIdentityError(null)
        setPlayerIdentityRefreshWarning(null)
        const response = await fetch('/api/player/account', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'revalidate' }) })
        const payload = await response.json().catch(() => null) as { status?: string; code?: string; message?: string } | null
        if (payload?.status === 'success' && payload.code === 'NO_LINKED_PLAYER') return
        if (!response.ok || payload?.status !== 'success') {
          const error = new Error(payload?.message ?? 'Player data could not be refreshed.') as PlayerIdentityRefreshFailure
          error.statusCode = response.status
          error.code = payload?.code
          throw error
        }
        refreshAttemptAt.set(user.id, Date.now())
      })
    } catch (caught) {
      const accountAfterFailure = await loadPlayerIdentity()
      if (!accountAfterFailure) return
      setPlayerIdentityRefreshWarning(caught instanceof Error ? `Cached player data is being used. ${caught.message}` : 'Cached player data is being used while refresh is unavailable.')
      return
    }

    if (!attempted) {
      await loadPlayerIdentity()
      return
    }

    try {
      const refreshedAccount = await loadPlayerIdentity()
      if (refreshedAccount) setPlayerIdentityRefreshWarning(null)
    } catch (caught) {
      setPlayerIdentityRefreshWarning(caught instanceof Error ? caught.message : 'Your linked player could not be refreshed.')
    }
  }, [isVisionAcceptanceRoute, loadPlayerIdentity, session?.access_token, user])

  useEffect(() => {
    if (authLoading || isVisionAcceptanceRoute) {
      return
    }

    let cancelled = false
    async function establish() {
      const account = await loadPlayerIdentity()
      if (!user || !account || cancelled) return
      const lastRefresh = Date.parse(account.last_refreshed_at ?? '')
      const throttled = Date.now() - (refreshAttemptAt.get(user.id) ?? 0) < REFRESH_THROTTLE_MS
      const stale = !Number.isFinite(lastRefresh) || Date.now() - lastRefresh > REFRESH_STALE_MS
      const shouldRefresh = canAutoRefresh && session?.access_token && (stale || !refreshAttemptAt.has(user.id)) && !throttled && refreshCoordinator.shouldAttempt(user.id, 'automatic')
      if (!cancelled && shouldRefresh) await refreshPlayerIdentity('automatic', account)
    }
    void establish()
    return () => { cancelled = true }
  }, [authLoading, canAutoRefresh, isVisionAcceptanceRoute, loadPlayerIdentity, refreshPlayerIdentity, session?.access_token, user])

  useEffect(() => {
    if (isVisionAcceptanceRoute || !session?.access_token || !user) return
    void fetch('/api/giftcodes?action=auto-run', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: '{}' }).catch(() => undefined)
  }, [isVisionAcceptanceRoute, session?.access_token, user])

  useEffect(() => {
    if (isVisionAcceptanceRoute) return
    function handlePlayerUpdate() {
      void refreshPlayerIdentity('manual')
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
  }, [isVisionAcceptanceRoute, refreshPlayerIdentity])

  const value =
    useMemo<PlayerIdentityContextValue>(
      () => ({
        playerAccount: isVisionAcceptanceRoute ? null : playerAccount,
        loadingPlayerAccount: isVisionAcceptanceRoute ? false : loadingPlayerAccount,
        playerIdentityError: isVisionAcceptanceRoute ? null : playerIdentityError,
        playerIdentityRefreshWarning: isVisionAcceptanceRoute ? null : playerIdentityRefreshWarning,
        refreshPlayerIdentity: isVisionAcceptanceRoute ? async () => {} : refreshPlayerIdentity,
      }),
      [
        isVisionAcceptanceRoute,
        playerAccount,
        loadingPlayerAccount,
        playerIdentityError,
        playerIdentityRefreshWarning,
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
