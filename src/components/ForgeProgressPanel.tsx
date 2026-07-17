import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import { supabase } from '../lib/supabase'

type ForgeProgressData = {
  hasProfile: boolean
  hasProgression: boolean
  showcasedHeroes: number
  hasTransferProfile: boolean
  hasPublicVisibility: boolean
}

const EMPTY_PROGRESS: ForgeProgressData = {
  hasProfile: false,
  hasProgression: false,
  showcasedHeroes: 0,
  hasTransferProfile: false,
  hasPublicVisibility: false,
}

type ProgressItem = {
  label: string
  detail: string
  complete: boolean
  to: string
}

function getForgeLevel(score: number) {
  if (score >= 100) return 5
  if (score >= 80) return 4
  if (score >= 60) return 3
  if (score >= 40) return 2
  if (score > 0) return 1
  return 0
}

function getNextItem(items: ProgressItem[]) {
  return items.find((item) => !item.complete) ?? null
}

export default function ForgeProgressPanel() {
  const { user, loading: authLoading } = useAuth()
  const {
    playerAccount,
    loadingPlayerAccount,
    playerIdentityError,
    refreshPlayerIdentity,
  } = usePlayerIdentity()
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadProgress() {
      if (authLoading || loadingPlayerAccount) return
      if (!user || !playerAccount) {
        setProgress(EMPTY_PROGRESS)
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      try {
        const [profileResult, progressionResult, heroResult, transferResult] = await Promise.all([
          supabase
            .from('player_profiles')
            .select('id, is_public')
            .eq('player_account_id', playerAccount.id)
            .maybeSingle(),
          supabase
            .from('player_progression_snapshots')
            .select('id')
            .eq('player_account_id', playerAccount.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('player_heroes')
            .select('id', { count: 'exact', head: true })
            .eq('player_account_id', playerAccount.id)
            .eq('is_showcase', true),
          supabase
            .from('transfer_profiles')
            .select('id, status')
            .eq('player_account_id', playerAccount.id)
            .maybeSingle(),
        ])

        for (const result of [profileResult, progressionResult, heroResult, transferResult]) {
          if (result.error) throw result.error
        }

        if (!cancelled) {
          setProgress({
            hasProfile: Boolean(profileResult.data),
            hasProgression: Boolean(progressionResult.data),
            showcasedHeroes: Math.min(heroResult.count ?? 0, 6),
            hasTransferProfile: Boolean(transferResult.data && transferResult.data.status !== 'draft'),
            hasPublicVisibility: Boolean(
              playerAccount.is_public && profileResult.data?.is_public,
            ),
          })
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Forge planning progress could not be loaded.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProgress()
    return () => {
      cancelled = true
    }
  }, [authLoading, loadingPlayerAccount, playerAccount, refreshToken, user])

  useEffect(() => {
    const refresh = () => {
      setRefreshToken((current) => current + 1)
    }
    window.addEventListener('kingshot-player-updated', refresh)
    return () => window.removeEventListener('kingshot-player-updated', refresh)
  }, [])

  const items = useMemo<ProgressItem[]>(() => [
    { label: 'Linked player', detail: playerAccount ? 'Primary player linked' : 'Link a Kingshot player', complete: Boolean(playerAccount), to: '/my-forge/player-identity' },
    { label: 'Player profile', detail: progress.hasProfile ? 'Profile record created' : 'Create your player profile', complete: progress.hasProfile, to: '/my-forge/profile' },
    { label: 'Progression snapshot', detail: progress.hasProgression ? 'Current position recorded' : 'Record your current progression', complete: progress.hasProgression, to: '/my-forge/progression' },
    { label: 'Hero Showcase', detail: `${progress.showcasedHeroes}/6 heroes selected`, complete: progress.showcasedHeroes === 6, to: '/my-forge/heroes' },
    { label: 'Transfer profile', detail: progress.hasTransferProfile ? 'Transfer planning recorded' : 'Complete transfer planning', complete: progress.hasTransferProfile, to: '/my-forge/transfer-profile' },
    { label: 'Public visibility', detail: progress.hasPublicVisibility ? 'Profile is public' : 'Review public visibility', complete: progress.hasPublicVisibility, to: '/my-forge/profile' },
  ], [playerAccount, progress])

  const score = Math.round((items.filter((item) => item.complete).length / items.length) * 100)
  const forgeLevel = getForgeLevel(score)
  const nextItem = getNextItem(items)

  if (authLoading || loadingPlayerAccount || loading) {
    return <section className="forge-progress" aria-busy="true"><p>Loading Forge planning…</p></section>
  }

  if (!user) {
    return <section className="forge-progress forge-progress--signed-out"><div className="forge-progress__icon">⚒</div><div><p className="eyebrow">Forge planning</p><h2>Begin your Forge journey</h2><p>Sign in to link your Kingshot player and record your planning information.</p></div></section>
  }

  if (playerIdentityError) {
    return <section className="forge-progress"><p className="eyebrow">Forge planning</p><h2>Planning is temporarily unavailable</h2><p>{playerIdentityError}</p><button className="button button--primary" type="button" onClick={() => void refreshPlayerIdentity()}>Retry identity load</button></section>
  }

  return <section className="forge-progress">
    <div className="forge-progress__header"><div><p className="eyebrow">Forge planning</p><h2>Forge Level {forgeLevel}</h2><p>Six player-owned sections, calculated from saved data.</p></div><div className="forge-progress__score"><strong>{score}%</strong><span>Complete</span></div></div>
    <div className="forge-progress__track" role="progressbar" aria-label="Forge planning completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}><span style={{ width: `${score}%` }} /></div>
    <div className="forge-progress__levels">{[1, 2, 3, 4, 5].map((level) => <span key={level} className={level <= forgeLevel ? 'forge-progress__level forge-progress__level--active' : 'forge-progress__level'}>{level}</span>)}</div>
    <div className="forge-progress__checklist">{items.map((item, index) => <Link key={item.label} className={item.complete ? 'forge-progress-item forge-progress-item--complete' : 'forge-progress-item'} to={item.to}><span>{item.complete ? '✓' : index + 1}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div></Link>)}</div>
    <div className="forge-progress__next"><span>Next objective</span><strong>{nextItem ? <Link to={nextItem.to}>{nextItem.detail}</Link> : 'Your player planning is complete'}</strong></div>
    {errorMessage ? <p className="profile-panel__error" role="alert">{errorMessage}</p> : null}
  </section>
}
