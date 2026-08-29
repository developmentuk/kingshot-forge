import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePlayerIdentity } from '../../context/PlayerIdentityContext'
import { trackForgePlayerEvent } from '../../platform/analytics/forgeAnalytics'
import type { PlayerAccount } from '../../types/playerAccount'
import { formatTownCenterRawLevel } from '../../../shared/domains/player-identity/townCenterLevel'
import ForgeProgressPanel from '../../components/ForgeProgressPanel'
import LinkedPlayerPanel from '../../components/LinkedPlayerPanel'

export function PrivatePlayerIdentityPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const {
    playerAccount,
    loadingPlayerAccount,
    playerIdentityError,
    playerIdentityRefreshWarning,
    refreshPlayerIdentity,
  } = usePlayerIdentity()

  useEffect(() => {
    trackForgePlayerEvent('player_identity_page_viewed', {
      surface: 'private',
      outcome: playerAccount ? 'linked' : 'unlinked',
    })
  }, [playerAccount])

  if (authLoading || loadingPlayerAccount) {
    return (
      <PlayerIdentityPageFrame>
        <section
          className="player-identity__notice"
          aria-live="polite"
          aria-busy="true"
        >
          <div>
            <p className="player-identity__eyebrow">Loading</p>
            <h2>Preparing your Player Passport</h2>
            <p>
              Forge is securely loading your linked Kingshot account.
            </p>
          </div>
        </section>
      </PlayerIdentityPageFrame>
    )
  }

  if (!user) {
    return (
      <PlayerIdentityPageFrame>
        <section className="player-identity__notice">
          <div>
            <p className="player-identity__eyebrow">Sign in required</p>
            <h2>Your Player Passport lives in My Forge</h2>
            <p>
              Sign in to connect your Kingshot player, manage what you
              share, and open your profile and hero tools.
            </p>
          </div>
          <button
            className="player-identity__button"
            type="button"
            onClick={() => void signInWithGoogle()}
          >
            Sign in with Google
          </button>
        </section>
      </PlayerIdentityPageFrame>
    )
  }

  if (playerIdentityError) {
    return (
      <PlayerIdentityPageFrame>
        <section className="player-identity__notice" role="alert">
          <div>
            <p className="player-identity__eyebrow">Unable to load</p>
            <h2>Your Player Passport is temporarily unavailable</h2>
            <p>{playerIdentityError}</p>
          </div>
          <button
            className="player-identity__button"
            type="button"
            onClick={() => void refreshPlayerIdentity()}
          >
            Try again
          </button>
        </section>
      </PlayerIdentityPageFrame>
    )
  }

  if (!playerAccount) {
    return (
      <PlayerIdentityPageFrame>
        <section className="player-identity__summary">
          <div>
            <p className="player-identity__eyebrow">Player Passport</p>
            <h2>Connect your Kingshot player</h2>
            <p>
              Your Forge account is ready. Link your Kingshot player to
              unlock identity, profile, progression, and showcase tools.
            </p>
          </div>
        </section>

        <section className="player-identity__panel">
          <p className="player-identity__eyebrow">Next step</p>
          <h2>Create your linked Player Passport</h2>
          <p>
            Player linking is managed from My Forge, where your account can
            be checked and refreshed without creating duplicate profiles.
          </p>
          <div className="player-identity__actions">
            <Link
              className="player-identity__button"
              to="/my-forge"
              onClick={() =>
                trackForgePlayerEvent('linked_character_flow_started', {
                  surface: 'player_identity',
                })
              }
            >
              Link a Kingshot player
            </Link>
            <button
              className="player-identity__button player-identity__button--secondary"
              type="button"
              onClick={() => void refreshPlayerIdentity()}
            >
              Check again
            </button>
          </div>
        </section>

        <LinkedPlayerPanel />
      </PlayerIdentityPageFrame>
    )
  }

  return (
    <PlayerIdentityPageFrame>
      <IdentitySummary playerAccount={playerAccount} />
      {playerIdentityRefreshWarning && (
        <section className="player-identity__notice" role="status">
          <div>
            <p className="player-identity__eyebrow">Refresh notice</p>
            <p>{playerIdentityRefreshWarning}</p>
          </div>
          <button
            className="player-identity__button player-identity__button--secondary"
            type="button"
            onClick={() => void refreshPlayerIdentity()}
          >
            Retry refresh
          </button>
        </section>
      )}
      <ForgeProgressPanel />
      <LinkedPlayerPanel />

      <div className="player-identity__layout">
        <section
          className="player-identity__main"
        >
          <section className="player-identity__panel">
            <p className="player-identity__eyebrow">Passport actions</p>
            <h2>Complete your player record</h2>
            <div className="player-identity__tool-grid">
              <IdentityTool
                title="Edit Passport"
                description="Add the player-controlled fields shown on your public Passport."
                to="/my-forge/profile"
                action="Edit Passport"
              />
              <IdentityTool
                title="Hero Showcase"
                description="Select and arrange the heroes displayed on your public Forge profile."
                to="/my-forge/heroes"
                action="Manage heroes"
              />
              <IdentityTool
                title="Progression"
                description="Record and review the milestones that describe your account progress."
                to="/my-forge/progression"
                action="Open progression"
              />
              <IdentityTool
                title="Transfer Profile"
                description="Optional planning for a future kingdom move."
                to="/my-forge/transfer-profile"
                action="Open optional transfer"
              />
            </div>
          </section>
        </section>

        <aside className="player-identity__side">
          <section className="player-identity__panel">
            <p className="player-identity__eyebrow">Verification</p>
            <h2>{formatVerification(playerAccount.verification_status)}</h2>
            <p>
              {verificationDescription(playerAccount.verification_status)}
            </p>
            {playerAccount.verified_at && ['verified', 'community_verified', 'officially_verified'].includes(playerAccount.verification_status) ? (
              <p className="player-identity__hint">
                Verified {formatDate(playerAccount.verified_at)}
              </p>
            ) : null}
          </section>

          <Link className="player-identity__button" to="/my-forge/profile">Edit Passport</Link>
        </aside>
      </div>
    </PlayerIdentityPageFrame>
  )
}

function IdentitySummary({
  playerAccount,
}: {
  playerAccount: PlayerAccount
}) {
  return (
    <section
      className="player-identity__summary"
      aria-labelledby="identity-summary-title"
    >
      <div>
        <p className="player-identity__eyebrow">
          My Forge · linked Kingshot player
        </p>
        <h2 id="identity-summary-title">
          Welcome back, {playerAccount.player_name}
        </h2>
        <p>
          Kingdom {playerAccount.kingdom_id} · {formatTownCenterRawLevel(playerAccount.town_center_level)}
        </p>
        <div className="player-identity__summary-status" aria-label="Passport status">
          <span>{formatVerification(playerAccount.verification_status)}</span>
          <span>{playerAccount.is_public ? 'Public Passport' : 'Private Passport'}</span>
        </div>
        <dl className="player-identity__summary-details">
          <div><dt>Player ID</dt><dd>{playerAccount.player_id}</dd></div>
          <div><dt>Last refreshed</dt><dd>{formatDate(playerAccount.last_refreshed_at)}</dd></div>
        </dl>
      </div>
      {playerAccount.profile_photo ? (
        <img
          className="player-identity__avatar"
          src={playerAccount.profile_photo}
          alt={`${playerAccount.player_name} profile`}
        />
      ) : (
        <div className="player-identity__revision" aria-hidden="true">
          <span>Kingdom</span>
          <strong>{playerAccount.kingdom_id}</strong>
        </div>
      )}
    </section>
  )
}

function IdentityTool({
  title,
  description,
  to,
  action,
}: {
  title: string
  description: string
  to: string
  action: string
}) {
  return (
    <article className="player-identity__tool-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <Link className="player-identity__text-link" to={to}>
        {action} →
      </Link>
    </article>
  )
}


function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatVerification(status: PlayerAccount['verification_status']) {
  switch (status) {
    case 'verified':
      return 'Verified player'
    case 'officially_verified':
      return 'Officially verified'
    case 'community_verified':
      return 'Community verified'
    case 'pending':
      return 'Verification pending'
    case 'rejected':
      return 'Verification rejected'
    case 'revoked':
      return 'Verification revoked'
    default:
      return 'Linked'
  }
}

function verificationDescription(
  status: PlayerAccount['verification_status'],
) {
  switch (status) {
    case 'verified':
      return 'Forge verified this Player ID through the Kingshot player service and linked it to your authenticated Forge account.'
    case 'officially_verified':
      return 'Forge has confirmed this player through an official verification route.'
    case 'community_verified':
      return 'A trusted community reviewer has confirmed this linked player.'
    case 'pending':
      return 'Your verification request is waiting for review.'
    case 'rejected':
      return 'The previous verification request could not be approved.'
    case 'revoked':
      return 'Verification is no longer active for this linked player.'
    default:
      return 'This Kingshot player is connected to your Forge account but is not yet verified.'
  }
}

function PlayerIdentityPageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="player-identity">
      <Link className="player-identity__back" to="/my-forge">
        ← Back to My Forge
      </Link>
      <header className="player-identity__hero">
        <p className="player-identity__eyebrow">My Forge</p>
        <h1>Player Passport</h1>
        <p>
          Your linked player, public presence, progress and next actions in one place.
        </p>
      </header>
      {children}
    </main>
  )
}
