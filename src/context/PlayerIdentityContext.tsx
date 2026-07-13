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

type PlayerIdentityContextValue = {
  playerAccount: PlayerAccount | null
  loadingPlayerAccount: boolean
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
  const { user, loading: authLoading } = useAuth()

  const [playerAccount, setPlayerAccount] =
    useState<PlayerAccount | null>(null)

  const [loadingPlayerAccount, setLoadingPlayerAccount] =
    useState(true)

  const refreshPlayerIdentity = useCallback(async () => {
    if (!user) {
      setPlayerAccount(null)
      setLoadingPlayerAccount(false)
      return
    }

    setLoadingPlayerAccount(true)

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
      setLoadingPlayerAccount(false)
      return
    }

    setPlayerAccount(
      data ? (data as PlayerAccount) : null,
    )

    setLoadingPlayerAccount(false)
  }, [user])

  useEffect(() => {
    if (authLoading) {
      return
    }

    void refreshPlayerIdentity()
  }, [authLoading, refreshPlayerIdentity])

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
        refreshPlayerIdentity,
      }),
      [
        playerAccount,
        loadingPlayerAccount,
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