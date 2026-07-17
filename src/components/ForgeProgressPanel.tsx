import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import { supabase } from '../lib/supabase'

type ForgeProgressData = {
  hasProfile: boolean
  hasProgression: boolean
  showcasedHeroes: number
  hasPublicVisibility: boolean
  hasTransferProfile: boolean
}

const EMPTY_PROGRESS: ForgeProgressData = {
  hasProfile: false,
  hasProgression: false,
  showcasedHeroes: 0,
  hasPublicVisibility: false,
  hasTransferProfile: false,
}

type ProgressItem = {
  label: string
  detail: string
  complete: boolean
  to: string
}

type Badge = {
  label: string
  detail: string
  earned: boolean
  to: string
}

function getForgeLevel(score: number) {
  if (score >= 100) return 5
  if (score >= 75) return 4
  if (score >= 50) return 3
  if (score >= 25) return 2
  if (score > 0) return 1
  return 0
}

export default function ForgeProgressPanel() {
  const { user, loading: authLoading } = useAuth()
  const { playerAccount, loadingPlayerAccount, playerIdentityError, refreshPlayerIdentity } = usePlayerIdentity()
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
          supabase.from('player_profiles').select('id, is_public').eq('player_account_id', playerAccount.id).maybeSingle(),
          supabase.from('player_progression_snapshots').select('id').eq('player_account_id', playerAccount.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('player_heroes').select('id', { count: 'exact', head: true }).eq('player_account_id', playerAccount.id).eq('is_showcase', true),
          supabase.from('transfer_profiles').select('id, status').eq('player_account_id', playerAccount.id).maybeSingle(),
        ])
        for (const result of [profileResult, progressionResult, heroResult, transferResult]) {
          if (result.error) throw result.error
        }
        if (!cancelled) {
          setProgress({
            hasProfile: Boolean(profileResult.data),
            hasProgression: Boolean(progressionResult.data),
            showcasedHeroes: Math.min(heroResult.count ?? 0, 6),
            hasPublicVisibility: Boolean(playerAccount.is_public && profileResult.data?.is_public),
            hasTransferProfile: Boolean(transferResult.data && transferResult.data.status !== 'draft'),
          })
        }
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : 'Forge planning progress could not be loaded.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadProgress()
    return () => { cancelled = true }
  }, [authLoading, loadingPlayerAccount, playerAccount, refreshToken, user])

  useEffect(() => {
    const refresh = () => setRefreshToken((current) => current + 1)
    window.addEventListener('kingshot-player-updated', refresh)
    return () => window.removeEventListener('kingshot-player-updated', refresh)
  }, [])

  const coreItems = useMemo<ProgressItem[]>(() => [
    { label: 'Identity linked', detail: playerAccount ? 'Primary player linked' : 'Link a Kingshot player', complete: Boolean(playerAccount), to: '/my-forge/player-identity' },
    { label: 'Player profile', detail: progress.hasProfile ? 'Profile record created' : 'Create your player profile', complete: progress.hasProfile, to: '/my-forge/profile' },
    { label: 'Progression tracked', detail: progress.hasProgression ? 'First snapshot recorded' : 'Record your current progression', complete: progress.hasProgression, to: '/my-forge/progression' },
    { label: 'Hero Showcase', detail: progress.showcasedHeroes === 6 ? 'Six heroes selected' : `${progress.showcasedHeroes}/6 heroes selected`, complete: progress.showcasedHeroes === 6, to: '/my-forge/heroes' },
  ], [playerAccount, progress])

  const badges = useMemo<Badge[]>(() => [
    { label: 'Identity Linked', detail: 'Your primary player is connected.', earned: Boolean(playerAccount), to: '/my-forge/player-identity' },
    { label: 'Profile Builder', detail: 'A player profile has been created.', earned: progress.hasProfile, to: '/my-forge/profile' },
    { label: 'Progress Tracker', detail: 'A first progression snapshot is saved.', earned: progress.hasProgression, to: '/my-forge/progression' },
    { label: 'Hero Curator', detail: 'Six heroes are selected for Showcase.', earned: progress.showcasedHeroes === 6, to: '/my-forge/heroes' },
    { label: 'Public Presence', detail: 'Account and profile visibility are public.', earned: progress.hasPublicVisibility, to: '/my-forge/profile' },
    { label: 'Transfer Ready', detail: 'Transfer planning is voluntarily completed.', earned: progress.hasTransferProfile, to: '/my-forge/transfer-profile' },
  ], [playerAccount, progress])

  const score = Math.round((coreItems.filter((item) => item.complete).length / coreItems.length) * 100)
  const forgeLevel = getForgeLevel(score)
  const nextItem = coreItems.find((item) => !item.complete)

  if (authLoading || loadingPlayerAccount || loading) return <section className="forge-progress" aria-busy="true"><p>Loading Forge planning…</p></section>
  if (!user) return <section className="forge-progress forge-progress--signed-out"><div className="forge-progress__icon">⚒</div><div><p className="eyebrow">Forge planning</p><h2>Begin your Forge journey</h2><p>Sign in to link your Kingshot player and build your player headquarters.</p></div></section>
  if (playerIdentityError) return <section className="forge-progress"><p className="eyebrow">Forge planning</p><h2>Planning is temporarily unavailable</h2><p>{playerIdentityError}</p><button className="button button--primary" type="button" onClick={() => void refreshPlayerIdentity()}>Retry identity load</button></section>

  return <section className="forge-progress">
    <div className="forge-progress__status"><div><p className="eyebrow">Forge status</p><h2>Forge Level {forgeLevel}</h2><p>{score}% of your required Player Headquarters milestones are complete.</p></div><div className="forge-progress__score"><strong>{score}%</strong><span>Core complete</span></div></div>
    <div className="forge-progress__track" role="progressbar" aria-label="Required Forge milestone completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}><span style={{ width: `${score}%` }} /></div>
    <div className="forge-progress__next"><div><span>Next action</span><strong>{nextItem ? nextItem.detail : 'Your required milestones are complete'}</strong></div>{nextItem ? <Link className="button button--primary" to={nextItem.to}>Open {nextItem.label}</Link> : null}</div>
    <div className="forge-progress__section"><div className="forge-progress__section-heading"><div><p className="eyebrow">Required milestones</p><h3>Build your Player Headquarters</h3></div><small>Four equal milestones · 25% each</small></div><div className="forge-progress__milestones">{coreItems.map((item) => <Link key={item.label} className={item.complete ? 'forge-progress-item forge-progress-item--complete' : 'forge-progress-item'} to={item.to}><span aria-hidden="true">{item.complete ? '✓' : '○'}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div></Link>)}</div></div>
    <div className="forge-progress__section forge-progress__section--achievements"><div className="forge-progress__section-heading"><div><p className="eyebrow">Achievements</p><h3>Optional player badges</h3></div><small>Badges never change core completion</small></div><div className="forge-progress__badges">{badges.map((badge) => <Link key={badge.label} className={badge.earned ? 'forge-progress-badge forge-progress-badge--earned' : 'forge-progress-badge forge-progress-badge--locked'} to={badge.to} aria-label={`${badge.label}: ${badge.earned ? 'earned' : 'locked'}`}><span aria-hidden="true">{badge.earned ? '✦' : '○'}</span><div><strong>{badge.label}</strong><small>{badge.earned ? 'Earned' : 'Locked'} · {badge.detail}</small></div></Link>)}</div></div>
    {errorMessage ? <p className="profile-panel__error" role="alert">{errorMessage}</p> : null}
  </section>
}
