import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import { supabase } from '../lib/supabase'
import { getPlayer } from '../services/kingshotApi'
import type { KingshotPlayer } from '../types/player'
import type { PlayerAccount } from '../types/playerAccount'
import type { AccountLinkOcrReview } from '../../shared/domains/player-identity/accountLinkingOcr'
import ScreenshotLinkingPanel from './ScreenshotLinkingPanel'

function getVerificationLabel(
  status: PlayerAccount['verification_status'],
) {
  switch (status) {
    case 'verified':
      return 'Verified player'

    case 'community_verified':
      return 'Community verified'

    case 'officially_verified':
      return 'Officially verified'

    case 'pending':
      return 'Verification pending'

    case 'rejected':
      return 'Verification rejected'

    case 'revoked':
      return 'Verification revoked'

    default:
      return 'Linked account'
  }
}

function getVerificationDescription(
  status: PlayerAccount['verification_status'],
) {
  switch (status) {
    case 'community_verified':
      return 'This account has been verified by an authorised Kingshot Forge community representative.'

    case 'officially_verified':
      return 'This account has been verified through an approved official method.'

    case 'pending':
      return 'A verification request is currently being reviewed.'

    case 'rejected':
      return 'The previous verification request was not approved.'

    case 'revoked':
      return 'Verification for this player account has been removed.'

    default:
      return 'The player data has been linked, but ownership has not yet been verified.'
  }
}

function notifyPlayerIdentityChanged() {
  window.dispatchEvent(
    new Event('kingshot-player-updated'),
  )
}

function LinkedPlayerPanel() {
  const {
    user,
    session,
    loading: authLoading,
  } = useAuth()
  const {
    playerAccount: linkedAccount,
    loadingPlayerAccount: loadingAccount,
    refreshPlayerIdentity,
    playerIdentityError,
  } = usePlayerIdentity()

  const [previewPlayer, setPreviewPlayer] =
    useState<KingshotPlayer | null>(null)

  const [playerId, setPlayerId] =
    useState('')

  const [lookingUp, setLookingUp] =
    useState(false)

  const [linking, setLinking] =
    useState(false)

  const [refreshing, setRefreshing] =
    useState(false)

  const [removing, setRemoving] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')
  const [ocrReview, setOcrReview] = useState<AccountLinkOcrReview | null>(null)
  const [fallbackSaving, setFallbackSaving] = useState(false)

  async function handleLookup(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const cleanedPlayerId = playerId
      .trim()
      .replace(/\s+/g, '')

    if (!cleanedPlayerId) {
      setErrorMessage(
        'Enter your Kingshot player ID.',
      )
      return
    }

    if (!/^\d+$/.test(cleanedPlayerId)) {
      setErrorMessage(
        'Player IDs should contain numbers only.',
      )
      return
    }

    setLookingUp(true)
    setMessage('')
    setErrorMessage('')
    setPreviewPlayer(null)

    try {
      const response =
        await getPlayer(cleanedPlayerId)

      setPreviewPlayer(response.data)
      setPlayerId(cleanedPlayerId)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The player could not be found.',
      )
      if (ocrReview?.playerId) setMessage('The Kingshot lookup is unavailable. You may save the reviewed screenshot details as an unverified link.')
    } finally {
      setLookingUp(false)
    }
  }

  async function handleOcrFallbackSave() {
    if (!session?.access_token || !ocrReview) return
    setFallbackSaving(true); setErrorMessage(''); setMessage('')
    try {
      const response = await fetch('/api/player/ocr-fallback', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(ocrReview) })
      const payload = await response.json().catch(() => null) as { status?: string; message?: string } | null
      if (!response.ok || payload?.status !== 'success') throw new Error(payload?.message ?? 'The reviewed screenshot details could not be saved.')
      setOcrReview(null); setMessage('Screenshot details saved as an unverified linked account.'); notifyPlayerIdentityChanged(); await refreshPlayerIdentity()
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'The OCR fallback could not be saved safely.') } finally { setFallbackSaving(false) }
  }

  async function handleLinkAccount() {
    if (!user || !session?.access_token || !previewPlayer) {
      return
    }

    setLinking(true)
    setMessage('')
    setErrorMessage('')

    try {
      const response = await fetch('/api/player/account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'link',
          playerId: previewPlayer.playerId,
        }),
      })
      const payload = await response.json().catch(() => null) as { status?: string; data?: unknown; message?: string } | null
      if (!response.ok || payload?.status !== 'success') {
        throw new Error(payload?.message ?? 'The player could not be linked.')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The player could not be linked.')
      setLinking(false)
      return
    }

    setPreviewPlayer(null)
    setPlayerId('')
    setMessage(
      'Kingshot account linked successfully.',
    )
    setLinking(false)

    notifyPlayerIdentityChanged()
    await refreshPlayerIdentity()
  }

  async function handleRefresh() {
    if (!user || !linkedAccount) {
      return
    }

    setRefreshing(true)
    setMessage('')
    setErrorMessage('')

    try {
      if (!session?.access_token) throw new Error('Sign in is required to verify this player.')
      const response = await fetch('/api/player/account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'revalidate' }),
      })
      const payload = await response.json().catch(() => null) as { status?: string; message?: string } | null
      if (!response.ok || payload?.status !== 'success') throw new Error(payload?.message ?? 'The player could not be revalidated.')
      setMessage(
        'Player verified through the Kingshot player service.',
      )

      notifyPlayerIdentityChanged()
      await refreshPlayerIdentity()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Player data could not be refreshed.',
      )
    } finally {
      setRefreshing(false)
    }
  }

  async function handleRemoveAccount() {
    if (!user || !linkedAccount) {
      return
    }

    const canRemove = [
      'linked',
      'pending',
      'rejected',
    ].includes(
      linkedAccount.verification_status,
    )

    if (!canRemove) {
      setErrorMessage(
        'Verified player accounts must be reviewed before they can be removed.',
      )
      return
    }

    const confirmed =
      window.confirm(
        'Remove this linked Kingshot account from your Forge profile?',
      )

    if (!confirmed) {
      return
    }

    setRemoving(true)
    setMessage('')
    setErrorMessage('')

    const { error } = await supabase
      .from('player_accounts')
      .delete()
      .eq(
        'id',
        linkedAccount.id,
      )
      .eq(
        'user_id',
        user.id,
      )

    if (error) {
      setErrorMessage(error.message)
      setRemoving(false)
      return
    }

    setPreviewPlayer(null)
    setPlayerId('')
    setMessage(
      'Linked Kingshot account removed.',
    )
    setRemoving(false)

    notifyPlayerIdentityChanged()
    await refreshPlayerIdentity()
  }

  async function handlePrivacyChange(
    isPublic: boolean,
  ) {
    if (!user || !linkedAccount) {
      return
    }

    setErrorMessage('')

    const { error } = await supabase
      .from('player_accounts')
      .update({
        is_public: isPublic,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        linkedAccount.id,
      )
      .eq(
        'user_id',
        user.id,
      )

    if (error) {
      setErrorMessage(error.message)
      return
    }

    await refreshPlayerIdentity()
  }

  if (authLoading) {
    return (
      <section className="linked-player-panel">
        <p>
          Loading Kingshot account…
        </p>
      </section>
    )
  }

  if (playerIdentityError) {
    return (
      <section className="linked-player-panel" role="alert">
        <p>{playerIdentityError}</p>
        <button type="button" className="button button--secondary" onClick={() => void refreshPlayerIdentity()}>
          Try again
        </button>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="linked-player-panel linked-player-panel--signed-out">
        <span>🎮</span>

        <div>
          <p className="eyebrow">
            Kingshot identity
          </p>

          <h2>
            Link your Kingshot player
          </h2>

          <p>
            Sign in with Google first,
            then connect your Kingshot
            player ID to build your
            community profile.
          </p>
        </div>
      </section>
    )
  }

  if (loadingAccount) {
    return (
      <section className="linked-player-panel">
        <p>
          Loading linked player…
        </p>
      </section>
    )
  }

  return (
    <section className="linked-player-panel">
      <div className="linked-player-panel__heading">
        <div>
          <p className="eyebrow">
            Kingshot identity
          </p>

          <h2>
            {linkedAccount
              ? 'Your linked player'
              : 'Link your Kingshot account'}
          </h2>

          <p>
            Connect your player ID to use
            your Kingshot identity,
            kingdom and avatar throughout
            Forge.
          </p>
        </div>

        {linkedAccount && (
          <span
            className={`linked-player-status linked-player-status--${linkedAccount.verification_status}`}
          >
            {getVerificationLabel(
              linkedAccount.verification_status,
            )}
          </span>
        )}
      </div>

      {!linkedAccount && (
        <>
          <ScreenshotLinkingPanel onCandidate={(candidate) => setPlayerId(candidate)} onReview={setOcrReview} />
          <form
            className="linked-player-search"
            onSubmit={handleLookup}
          >
            <div className="field">
              <label htmlFor="linked-player-id">
                Kingshot player ID
              </label>

              <input
                id="linked-player-id"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={playerId}
                maxLength={20}
                placeholder="Enter your player ID"
                onChange={(event) =>
                  setPlayerId(
                    event.target.value,
                  )
                }
              />

              <span className="field__help">
                Your player ID can be
                found on your in-game
                Kingshot profile.
              </span>
            </div>

            <button
              type="submit"
              className="button button--primary"
              disabled={lookingUp}
            >
              {lookingUp
                ? 'Finding player…'
                : 'Find Player'}
            </button>
          </form>

          {previewPlayer && (
            <article className="linked-player-preview">
              <div className="linked-player-preview__identity">
                {previewPlayer.profilePhoto ? (
                  <img
                    src={
                      previewPlayer.profilePhoto
                    }
                    alt={`${previewPlayer.name} profile`}
                  />
                ) : (
                  <span className="linked-player-preview__avatar-fallback">
                    👤
                  </span>
                )}

                <div>
                  <span>
                    Confirm player
                  </span>

                  <h3>
                    {previewPlayer.name}
                  </h3>

                  <p>
                    Kingdom{' '}
                    {
                      previewPlayer.kingdom
                    }
                    {' · '}
                    {previewPlayer
                      .levelRenderedDetailed ||
                      previewPlayer
                        .levelRendered ||
                      `Level ${previewPlayer.level}`}
                  </p>

                  <small>
                    Player ID:{' '}
                    {
                      previewPlayer.playerId
                    }
                  </small>
                </div>
              </div>

              <div className="linked-player-preview__warning">
                <strong>
                  Is this your account?
                </strong>

                <p>
                  Linking stores this
                  public player
                  information in your
                  Kingshot Forge profile.
                  Ownership is not yet
                  verified.
                </p>
              </div>

              <div className="linked-player-preview__actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() =>
                    setPreviewPlayer(null)
                  }
                >
                  Search Again
                </button>

                <button
                  type="button"
                  className="button button--primary"
                  disabled={linking}
                  onClick={() =>
                    void handleLinkAccount()
                  }
                >
                  {linking
                    ? 'Linking…'
                    : 'Link This Player'}
                </button>
              </div>
            </article>
          )}
          {ocrReview && !previewPlayer && (
            <div className="linked-player-preview__warning">
              <strong>Lookup fallback</strong>
              <p>The API lookup did not complete. Saving these reviewed values will remain unverified and will not invoke the player-link mutation.</p>
              <button type="button" className="button button--secondary" disabled={fallbackSaving} onClick={() => void handleOcrFallbackSave()}>{fallbackSaving ? 'Saving review…' : 'Save as unverified review'}</button>
            </div>
          )}
        </>
      )}

      {linkedAccount && (
        <article className="linked-player-card">
          <div className="linked-player-card__identity">
            {linkedAccount.profile_photo ? (
              <img
                src={
                  linkedAccount.profile_photo
                }
                alt={`${linkedAccount.player_name} profile`}
                className="linked-player-card__avatar"
              />
            ) : (
              <span className="linked-player-card__avatar linked-player-card__avatar--fallback">
                👤
              </span>
            )}

            <div>
              <span className="linked-player-card__label">
                Primary Kingshot player
              </span>

              <h3>
                {
                  linkedAccount.player_name
                }
              </h3>

              <p>
                {linkedAccount
                  .level_rendered_detailed ||
                  linkedAccount
                    .level_rendered ||
                  (linkedAccount.player_level
                    ? `Level ${linkedAccount.player_level}`
                    : 'Level unavailable')}
              </p>
            </div>
          </div>

          <div className="linked-player-card__stats">
            <div>
              <span>Kingdom</span>

              <strong>
                {
                  linkedAccount.kingdom_id
                }
              </strong>
            </div>

            <div>
              <span>Player ID</span>

              <strong>
                {
                  linkedAccount.player_id
                }
              </strong>
            </div>

            <div>
              <span>
                Last refreshed
              </span>

              <strong>
                {new Intl.DateTimeFormat(
                  'en-GB',
                  {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute:
                      '2-digit',
                  },
                ).format(
                  new Date(
                    linkedAccount.last_refreshed_at,
                  ),
                )}
              </strong>
            </div>
          </div>

          <div className="linked-player-card__verification">
            <strong>
              {linkedAccount.verification_status === 'verified'
                ? 'Verified player'
                : getVerificationLabel(linkedAccount.verification_status)}
            </strong>

            <p>
              {linkedAccount.verification_status === 'verified'
                ? 'This Player ID was checked against the Kingshot player service and linked to your Forge account.'
                : getVerificationDescription(linkedAccount.verification_status)}
            </p>

            {linkedAccount.verified_at && (
              <p>
                Verified {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(linkedAccount.verified_at))}
              </p>
            )}
          </div>

          <label className="linked-player-privacy">
            <input
              type="checkbox"
              checked={
                linkedAccount.is_public
              }
              onChange={(event) =>
                void handlePrivacyChange(
                  event.target.checked,
                )
              }
            />

            <span>
              Show this player on public
              kingdom and alliance member
              lists
            </span>
          </label>

          <div className="linked-player-card__actions">
            <button
              type="button"
              className="button button--secondary"
              disabled={refreshing}
              onClick={() =>
                void handleRefresh()
              }
            >
              {refreshing
                ? 'Checking player…'
                : linkedAccount.verification_status === 'verified'
                  ? 'Refresh Player Data'
                  : 'Revalidate player'}
            </button>

            <button
              type="button"
              className="remove-saved-button"
              disabled={removing}
              onClick={() =>
                void handleRemoveAccount()
              }
            >
              {removing
                ? 'Removing…'
                : 'Remove Linked Player'}
            </button>
          </div>
        </article>
      )}

      {message && (
        <p className="linked-player-message linked-player-message--success">
          {message}
        </p>
      )}

      {errorMessage && (
        <p className="linked-player-message linked-player-message--error">
          {errorMessage}
        </p>
      )}
    </section>
  )
}

export default LinkedPlayerPanel
