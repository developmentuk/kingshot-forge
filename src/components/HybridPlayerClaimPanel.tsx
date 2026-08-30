import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import { supabase } from '../lib/supabase'
import {
  createSelfReportedClaim,
  linkKingshotPlayer,
  searchPlayerClaim,
} from '../services/playerClaimService'
import type { PlayerAccount } from '../types/playerAccount'
import type {
  IndexedPlayerRecord,
  PlayerClaimSearchResult,
} from '../types/playerClaim'
import type { AccountLinkOcrReview } from '../../shared/domains/player-identity/accountLinkingOcr'
import { formatTownCenterRawLevel } from '../../shared/domains/player-identity/townCenterLevel'
import ScreenshotLinkingPanel from './ScreenshotLinkingPanel'

function notifyPlayerIdentityChanged() {
  window.dispatchEvent(new Event('kingshot-player-updated'))
}

function cleanPlayerId(value: string) {
  return value.trim().replace(/\s+/gu, '')
}

function cleanKingdomId(value: string) {
  return value.trim()
}

function verificationLabel(status: PlayerAccount['verification_status']) {
  switch (status) {
    case 'verified': return 'Legacy service verified'
    case 'officially_verified': return 'Officially verified'
    case 'community_verified': return 'Community verified'
    case 'pending': return 'Verification pending'
    case 'rejected': return 'Verification rejected'
    case 'revoked': return 'Verification revoked'
    default: return 'Self-reported claim'
  }
}

function verificationDescription(status: PlayerAccount['verification_status']) {
  switch (status) {
    case 'verified': return 'This account was verified before the previous player lookup service was retired.'
    case 'officially_verified': return 'This account has been confirmed through an approved official route.'
    case 'community_verified': return 'A trusted Forge reviewer has confirmed the submitted player evidence.'
    case 'pending': return 'Screenshot evidence has been submitted and is waiting for review.'
    case 'rejected': return 'The previous evidence could not be approved. You can submit a new screenshot.'
    case 'revoked': return 'Verification is no longer active for this claim.'
    default: return 'The Player ID and State were supplied by the signed-in user. Ownership is not yet verified.'
  }
}

function formatPower(value: number | null) {
  if (value === null) return null
  return new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function HybridPlayerClaimPanel() {
  const { user, session, loading: authLoading } = useAuth()
  const {
    playerAccount: linkedAccount,
    loadingPlayerAccount: loadingAccount,
    refreshPlayerIdentity,
    playerIdentityError,
    playerIdentityRefreshWarning,
  } = usePlayerIdentity()

  const [playerId, setPlayerId] = useState('')
  const [kingdomId, setKingdomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [townCenterLevel, setTownCenterLevel] = useState('')
  const [searchResult, setSearchResult] = useState<PlayerClaimSearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [linkingLivePlayer, setLinkingLivePlayer] = useState(false)
  const [submittingEvidence, setSubmittingEvidence] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [ocrReview, setOcrReview] = useState<AccountLinkOcrReview | null>(null)

  function validateIdentityInputs() {
    const cleanId = cleanPlayerId(playerId)
    const cleanState = cleanKingdomId(kingdomId)
    if (!/^\d{1,20}$/u.test(cleanId)) throw new Error('Enter a valid Kingshot Player ID using numbers only.')
    if (!/^\d{1,4}$/u.test(cleanState) || Number(cleanState) < 1 || Number(cleanState) > 9999) {
      throw new Error('Enter a valid Kingshot State between 1 and 9999.')
    }
    return { playerId: cleanId, kingdomId: cleanState }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    setSearchResult(null)

    if (!session?.access_token) {
      setErrorMessage('Sign in is required to claim a player.')
      return
    }

    let identity: ReturnType<typeof validateIdentityInputs>
    try {
      identity = validateIdentityInputs()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Enter a valid Player ID and State.')
      return
    }

    setSearching(true)
    try {
      const result = await searchPlayerClaim(session.access_token, identity.playerId, identity.kingdomId)
      setPlayerId(identity.playerId)
      setKingdomId(identity.kingdomId)
      setSearchResult(result)
      setMessage(result.message)
      if (result.player && result.match === 'owned') {
        await refreshPlayerIdentity()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The Forge player index could not be searched.')
    } finally {
      setSearching(false)
    }
  }

  async function handleLiveLink() {
    if (!session?.access_token || !searchResult?.claimable) return
    setMessage('')
    setErrorMessage('')

    let identity: ReturnType<typeof validateIdentityInputs>
    try {
      identity = validateIdentityInputs()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Review the player link details.',
      )
      return
    }

    setLinkingLivePlayer(true)
    try {
      await linkKingshotPlayer(
        session.access_token,
        identity.playerId,
        identity.kingdomId,
      )
      setMessage(
        'Kingshot player linked from the live player service. Ownership is not yet verified.',
      )
      notifyPlayerIdentityChanged()
      await refreshPlayerIdentity()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The live Kingshot player could not be linked.',
      )
    } finally {
      setLinkingLivePlayer(false)
    }
  }

  async function handleClaim() {
    if (!session?.access_token || !searchResult?.claimable) return
    setMessage('')
    setErrorMessage('')

    let identity: ReturnType<typeof validateIdentityInputs>
    try {
      identity = validateIdentityInputs()
      if (!playerName.trim()) throw new Error('Enter the player name shown on the Kingshot profile.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Review the player claim details.')
      return
    }

    setClaiming(true)
    try {
      await createSelfReportedClaim(session.access_token, {
        ...identity,
        playerName: playerName.trim(),
        townCenterLevel: townCenterLevel.trim() || undefined,
      })
      setMessage('Player claimed as self-reported. Submit a profile screenshot when you are ready to request verification.')
      notifyPlayerIdentityChanged()
      await refreshPlayerIdentity()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The player claim could not be created.')
    } finally {
      setClaiming(false)
    }
  }

  async function handleEvidenceSubmit() {
    if (!session?.access_token || !ocrReview) return
    setSubmittingEvidence(true)
    setErrorMessage('')
    setMessage('')
    try {
      const response = await fetch('/api/player/ocr-fallback', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ocrReview,
          corrections: ocrReview.userConfirmed,
        }),
      })
      const payload = await response.json().catch(() => null) as { status?: string; message?: string } | null
      if (!response.ok || payload?.status !== 'success') {
        throw new Error(payload?.message ?? 'The screenshot evidence could not be submitted.')
      }
      setOcrReview(null)
      setMessage('Screenshot evidence submitted. The player claim is now waiting for review.')
      notifyPlayerIdentityChanged()
      await refreshPlayerIdentity()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The screenshot evidence could not be submitted safely.')
    } finally {
      setSubmittingEvidence(false)
    }
  }

  async function handleRemoveAccount() {
    if (!user || !linkedAccount) return
    if (!['linked', 'pending', 'rejected'].includes(linkedAccount.verification_status)) {
      setErrorMessage('Verified player claims require a reviewer before they can be removed.')
      return
    }
    if (!window.confirm('Remove this Kingshot player claim from your Forge account?')) return

    setRemoving(true)
    setMessage('')
    setErrorMessage('')
    const { error } = await supabase
      .from('player_accounts')
      .delete()
      .eq('id', linkedAccount.id)
      .eq('user_id', user.id)

    if (error) {
      setErrorMessage(error.message)
      setRemoving(false)
      return
    }

    setSearchResult(null)
    setPlayerId('')
    setKingdomId('')
    setPlayerName('')
    setTownCenterLevel('')
    setMessage('Player claim removed.')
    setRemoving(false)
    notifyPlayerIdentityChanged()
    await refreshPlayerIdentity()
  }

  async function handlePrivacyChange(isPublic: boolean) {
    if (!user || !linkedAccount) return
    setErrorMessage('')
    const { error } = await supabase
      .from('player_accounts')
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq('id', linkedAccount.id)
      .eq('user_id', user.id)

    if (error) {
      setErrorMessage(error.message)
      return
    }
    await refreshPlayerIdentity()
  }

  function handleOcrReview(review: AccountLinkOcrReview | null) {
    setOcrReview(review)
    if (!review) return
    setPlayerId(review.playerId)
    setKingdomId(review.kingdom)
    setPlayerName(review.displayName)
    setTownCenterLevel(review.townCenterLevel)
    setSearchResult(null)
  }

  if (authLoading || loadingAccount) {
    return <section className="linked-player-panel"><p>Loading Player Passport…</p></section>
  }

  if (playerIdentityError) {
    return (
      <section className="linked-player-panel" role="alert">
        <p>{playerIdentityError}</p>
        <button type="button" className="button button--secondary" onClick={() => void refreshPlayerIdentity()}>Try again</button>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="linked-player-panel linked-player-panel--signed-out">
        <span>🎮</span>
        <div><p className="eyebrow">Player claim</p><h2>Sign in to claim your Kingshot player</h2><p>Claims are connected to your Forge account and can later be upgraded with reviewed evidence.</p></div>
      </section>
    )
  }

  return (
    <section className="linked-player-panel">
      {playerIdentityRefreshWarning && (
        <div className="linked-player-message linked-player-message--warning" role="status">
          <p>{playerIdentityRefreshWarning}</p>
          <button type="button" className="button button--secondary" onClick={() => void refreshPlayerIdentity()}>Retry refresh</button>
        </div>
      )}
      <div className="linked-player-panel__heading">
        <div>
          <p className="eyebrow">Hybrid player identity</p>
          <h2>{linkedAccount ? 'Your claimed player' : 'Claim your Kingshot player'}</h2>
          <p>Player ID and State create the claim. Forge Vision or a trusted reviewer can verify it later.</p>
        </div>
        {linkedAccount && <span className={`linked-player-status linked-player-status--${linkedAccount.verification_status}`}>{verificationLabel(linkedAccount.verification_status)}</span>}
      </div>

      {!linkedAccount && (
        <>
          <form className="linked-player-search linked-player-search--state-aware" onSubmit={handleSearch}>
            <div className="field">
              <label htmlFor="hybrid-player-id">Kingshot Player ID</label>
              <input id="hybrid-player-id" type="text" inputMode="numeric" autoComplete="off" value={playerId} maxLength={20} placeholder="Enter your Player ID" onChange={(event) => { setPlayerId(event.target.value); setSearchResult(null) }} />
              <span className="field__help">Found beneath your player name on the in-game profile.</span>
            </div>
            <div className="field">
              <label htmlFor="hybrid-player-state">Kingshot State</label>
              <input id="hybrid-player-state" type="text" inputMode="numeric" autoComplete="off" value={kingdomId} maxLength={4} placeholder="e.g. 850" onChange={(event) => { setKingdomId(event.target.value); setSearchResult(null) }} />
              <span className="field__help">Enter the State shown on the same profile.</span>
            </div>
            <button type="submit" className="button button--primary" disabled={searching}>{searching ? 'Checking Forge index…' : 'Check Player ID'}</button>
          </form>

          {searchResult?.player && <IndexedPlayerPreview player={searchResult.player} />}

          {searchResult?.claimable && (
            <article className="linked-player-preview">
              <div className="linked-player-preview__warning">
                <strong>No existing Forge record</strong>
                <p>Link the current Kingshot record through the live player service, or use the self-reported fallback if live lookup is unavailable. Neither route verifies ownership.</p>
              </div>
              <div className="linked-player-preview__actions">
                <button
                  type="button"
                  className="button button--primary"
                  disabled={linkingLivePlayer}
                  onClick={() => void handleLiveLink()}
                >
                  {linkingLivePlayer
                    ? 'Linking live player…'
                    : 'Link live Kingshot player'}
                </button>
              </div>
              <p className="field__help">
                Live linking checks the current public player record and State.
                It proves the player exists, not that you own the account.
              </p>
              <div className="linked-player-search linked-player-search--state-aware">
                <div className="field">
                  <label htmlFor="hybrid-player-name">Player name</label>
                  <input id="hybrid-player-name" type="text" autoComplete="off" value={playerName} maxLength={120} placeholder="Name shown in Kingshot" onChange={(event) => setPlayerName(event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="hybrid-town-center">Town Centre level <span aria-hidden="true">·</span> optional</label>
                  <input id="hybrid-town-center" type="number" inputMode="numeric" min={1} max={30} value={townCenterLevel} placeholder="1–30" onChange={(event) => setTownCenterLevel(event.target.value)} />
                </div>
              </div>
              <div className="linked-player-preview__actions">
                <button type="button" className="button button--secondary" onClick={() => setSearchResult(null)}>Start again</button>
                <button type="button" className="button button--primary" disabled={claiming} onClick={() => void handleClaim()}>{claiming ? 'Creating claim…' : 'Create Self-Reported Claim'}</button>
              </div>
            </article>
          )}

          <ScreenshotLinkingPanel onCandidate={setPlayerId} onReview={handleOcrReview} />
          {ocrReview && (
            <div className="linked-player-preview__warning">
              <strong>Submit screenshot evidence</strong>
              <p>Review every extracted value above. Submission creates a pending claim; it does not immediately mark the account verified.</p>
              <button type="button" className="button button--primary" disabled={submittingEvidence} onClick={() => void handleEvidenceSubmit()}>{submittingEvidence ? 'Submitting evidence…' : 'Submit for Verification'}</button>
            </div>
          )}
        </>
      )}

      {linkedAccount && (
        <>
          <article className="linked-player-card">
            <div className="linked-player-card__identity">
              {linkedAccount.profile_photo ? <img src={linkedAccount.profile_photo} alt={`${linkedAccount.player_name} profile`} className="linked-player-card__avatar" /> : <span className="linked-player-card__avatar linked-player-card__avatar--fallback">👤</span>}
              <div>
                <span className="linked-player-card__label">Primary Kingshot player</span>
                <h3>{linkedAccount.player_name}</h3>
                <p>{formatTownCenterRawLevel(linkedAccount.town_center_level)}</p>
              </div>
            </div>
            <div className="linked-player-card__stats">
              <div><span>State</span><strong>{linkedAccount.kingdom_id}</strong></div>
              <div><span>Player ID</span><strong>{linkedAccount.player_id}</strong></div>
              <div><span>Claim status</span><strong>{verificationLabel(linkedAccount.verification_status)}</strong></div>
            </div>
            <div className="linked-player-card__verification">
              <strong>{verificationLabel(linkedAccount.verification_status)}</strong>
              <p>{verificationDescription(linkedAccount.verification_status)}</p>
            </div>
            <label className="linked-player-privacy">
              <input type="checkbox" checked={linkedAccount.is_public} onChange={(event) => void handlePrivacyChange(event.target.checked)} />
              <span>Show this player in public Forge lookup and public member lists</span>
            </label>
            <div className="linked-player-card__actions">
              {['linked', 'pending', 'rejected'].includes(linkedAccount.verification_status) && <button type="button" className="button button--secondary" disabled={removing} onClick={() => void handleRemoveAccount()}>{removing ? 'Removing…' : 'Remove Claim'}</button>}
            </div>
          </article>

          {['linked', 'rejected'].includes(linkedAccount.verification_status) && (
            <>
              <ScreenshotLinkingPanel onCandidate={() => undefined} onReview={handleOcrReview} />
              {ocrReview && (
                <div className="linked-player-preview__warning">
                  <strong>Request verification</strong>
                  <p>The screenshot must show the same Player ID and State as your existing claim. Forge recomputes OCR server-side before accepting the request.</p>
                  <button type="button" className="button button--primary" disabled={submittingEvidence} onClick={() => void handleEvidenceSubmit()}>{submittingEvidence ? 'Submitting evidence…' : 'Submit for Verification'}</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {message && <p className="linked-player-message linked-player-message--success">{message}</p>}
      {errorMessage && <p className="linked-player-message linked-player-message--error" role="alert">{errorMessage}</p>}
    </section>
  )
}

function IndexedPlayerPreview({ player }: { player: IndexedPlayerRecord }) {
  return (
    <article className="linked-player-preview">
      <div className="linked-player-preview__identity">
        {player.profilePhoto ? <img src={player.profilePhoto} alt={`${player.playerName} profile`} /> : <span className="linked-player-preview__avatar-fallback">👤</span>}
        <div>
          <span>Indexed Forge record</span>
          <h3>{player.playerName}</h3>
          <p>State {player.kingdomId}{player.townCenterLevel ? ` · ${formatTownCenterRawLevel(player.townCenterLevel)}` : ''}</p>
          <small>{player.allianceName ? `${player.allianceName} · ` : ''}{formatPower(player.currentPower) ? `${formatPower(player.currentPower)} power · ` : ''}Player ID {player.playerId}</small>
        </div>
      </div>
      <div className="linked-player-preview__warning">
        <strong>Stored Forge observation</strong>
        <p>This record may be older than the current in-game profile and does not prove account ownership.</p>
      </div>
    </article>
  )
}

export default HybridPlayerClaimPanel
