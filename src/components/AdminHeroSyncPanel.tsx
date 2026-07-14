import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  syncHeroCatalogue,
  type HeroCatalogueSyncResult,
} from '../services/heroCatalogueSyncService'
import DashboardCard from './dashboard/DashboardCard'

type AdminStatus =
  | 'loading'
  | 'admin'
  | 'not-admin'
  | 'signed-out'

export default function AdminHeroSyncPanel() {
  const {
    user,
    loading: authLoading,
  } = useAuth()

  const [adminStatus, setAdminStatus] =
    useState<AdminStatus>('loading')

  const [syncing, setSyncing] =
    useState(false)

  const [result, setResult] =
    useState<HeroCatalogueSyncResult | null>(null)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function checkAdminStatus() {
      if (authLoading) {
        return
      }

      if (!user) {
        setAdminStatus('signed-out')
        return
      }

      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) {
        return
      }

      if (error) {
        setErrorMessage(error.message)
        setAdminStatus('not-admin')
        return
      }

      const isAdmin =
        data?.role === 'admin'

      setAdminStatus(
        isAdmin
          ? 'admin'
          : 'not-admin',
      )
    }

    void checkAdminStatus()

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    setErrorMessage('')

    try {
      const syncResult =
        await syncHeroCatalogue()

      setResult(syncResult)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The hero catalogue could not be synchronised.',
      )
    } finally {
      setSyncing(false)
    }
  }

  if (
    authLoading ||
    adminStatus === 'loading'
  ) {
    return (
      <div
        className="admin-hero-sync"
        aria-busy="true"
      >
        <p>Checking administrator access…</p>
      </div>
    )
  }

  if (adminStatus !== 'admin') {
    return null
  }

  return (
  <DashboardCard
    title="Catalogue Administration"
    subtitle="Synchronise Kingshot reference data used by Forge."
    icon="⚙️"
    accent="purple"
  >
    <div className="admin-hero-sync">
      <div className="admin-hero-sync__content">
        <div>
          <span className="admin-hero-sync__badge">
            Administrator
          </span>

          <h3>Hero catalogue sync</h3>

          <p>
            Fetch the latest hero reference data
            from KingshotPro and update the
            Supabase hero catalogue.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          disabled={syncing}
          onClick={() => void handleSync()}
        >
          {syncing
            ? 'Synchronising heroes…'
            : 'Sync hero catalogue'}
        </button>
      </div>

      {result && (
        <div
          className="admin-hero-sync__result"
          role="status"
        >
          <strong>Hero catalogue updated</strong>

          <span>
            {result.activeHeroes} active heroes
            synchronised.
          </span>

          {result.sourceUpdatedAt && (
            <span>
              Source updated:{' '}
              {result.sourceUpdatedAt}
            </span>
          )}
        </div>
      )}

      {errorMessage && (
        <p
          className="profile-panel__error"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  </DashboardCard>
)
}