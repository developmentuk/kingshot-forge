import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePlayerIdentity } from '../../context/PlayerIdentityContext'
import { trackForgePlayerEvent } from '../../platform/analytics/forgeAnalytics'
import type { PlayerAccount } from '../../types/playerAccount'

export function PrivatePlayerIdentityPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const {
    playerAccount,
    loadingPlayerAccount,
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
            <h2>Preparing your Player Identity</h2>
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
            <h2>Your Player Identity lives in My Forge</h2>
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

  if (!playerAccount) {
    return (
      <PlayerIdentityPageFrame>
        <section className="player-identity__summary">
          <div>
            <p className="player-identity__eyebrow">Player Identity</p>
            <h2>Connect your Kingshot player</h2>
            <p>
              Your Forge account is ready. Link your Kingshot player to
              unlock identity, profile, progression, and showcase tools.
            </p>
          </div>
        </section>

        <section className="player-identity__panel">
          <p className="player-identity__eyebrow">Next step</p>
          <h2>Create your linked player identity</h2>
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
      </PlayerIdentityPageFrame>
    )
  }

  return (
    <PlayerIdentityPageFrame>
      <IdentitySummary playerAccount={playerAccount} />

      <div className="player-identity__layout">
        <section
          className="player-identity__main"
          aria-labelledby="linked-player-title"
        >
          <section className="player-identity__panel">
            <p className="player-identity__eyebrow">Primary identity</p>
            <h2 id="linked-player-title">{playerAccount.player_name}</h2>

            <dl className="player-identity__details">
              <div>
                <dt>Player ID</dt>
                <dd>{playerAccount.player_id}</dd>
              </div>
              <div>
                <dt>Kingdom</dt>
                <dd>{playerAccount.kingdom_id}</dd>
              </div>
              <div>
                <dt>Level</dt>
                <dd>{formatLevel(playerAccount)}</dd>
              </div>
              <div>
                <dt>Last refreshed</dt>
                <dd>{formatDate(playerAccount.last_refreshed_at)}</dd>
              </div>
            </dl>

            <div className="player-identity__actions">
              <Link className="player-identity__button" to="/my-forge">
                Manage linked player
              </Link>
              <button
                className="player-identity__button player-identity__button--secondary"
                type="button"
                onClick={() => void refreshPlayerIdentity()}
              >
                Refresh identity
              </button>
            </div>
          </section>

          <section className="player-identity__panel">
            <p className="player-identity__eyebrow">Profile tools</p>
            <h2>Build your Forge presence</h2>
            <div className="player-identity__tool-grid">
              <IdentityTool
                title="Player profile"
                description="Add your alliance, Town Center, VIP level, languages, and introduction."
                to="/my-forge/profile"
                action="Edit profile"
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
            {playerAccount.verified_at ? (
              <p className="player-identity__hint">
                Verified {formatDate(playerAccount.verified_at)}
              </p>
            ) : null}
          </section>

          <section className="player-identity__panel">
            <p className="player-identity__eyebrow">Visibility</p>
            <h2>
              {playerAccount.is_public
                ? 'Public profile enabled'
                : 'Private profile'}
            </h2>
            <p>
              {playerAccount.is_public
                ? 'Your linked player can be included in your public Forge experience.'
                : 'Your linked player is currently visible only inside your account.'}
            </p>
            <Link className="player-identity__button" to="/my-forge/profile">
              Manage profile visibility
            </Link>
          </section>
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
          Kingdom {playerAccount.kingdom_id} · {formatVerification(
            playerAccount.verification_status,
          )}
        </p>
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

function formatLevel(playerAccount: PlayerAccount) {
  return (
    playerAccount.level_rendered_detailed ||
    playerAccount.level_rendered ||
    (playerAccount.player_level
      ? `Level ${playerAccount.player_level}`
      : 'Not available')
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
      <header className="player-identity__hero">
        <p className="player-identity__eyebrow">My Forge</p>
        <h1>Player Identity</h1>
        <p>
          Your linked Kingshot player, verification, profile tools, and
          sharing status in one place.
        </p>
      </header>
      {children}
    </main>
  )
}
