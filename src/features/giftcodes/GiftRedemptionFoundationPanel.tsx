import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePlayerIdentity } from '../../context/PlayerIdentityContext'

const OFFICIAL_REDEMPTION_URL =
  'https://ks-giftcode.centurygame.com/'

function getVerificationLabel(status: string) {
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
      return 'Linked, not verified'
  }
}

export function GiftRedemptionFoundationPanel() {
  const { user, loading: authLoading } = useAuth()
  const {
    playerAccount,
    loadingPlayerAccount,
  } = usePlayerIdentity()

  const identityLoading =
    authLoading || loadingPlayerAccount

  return (
    <section
      className="gift-redemption-panel"
      aria-labelledby="gift-redemption-title"
    >
      <div className="gift-redemption-panel__intro">
        <p className="eyebrow">Manual redemption</p>

        <h2 id="gift-redemption-title">
          Confirm the right Governor
        </h2>

        <p>
          Copy a code below, confirm your linked character,
          then redeem on the Century Games page. Forge does
          not submit codes or share your linked Player ID.
        </p>
      </div>

      <div
        className="gift-redemption-panel__identity"
        aria-live="polite"
      >
        {identityLoading ? (
          <p>Checking your linked Governor…</p>
        ) : !user ? (
          <>
            <strong>No Forge account signed in</strong>
            <span>
              You can still redeem manually, or sign in to
              see your linked Governor here.
            </span>
            <Link
              to="/my-forge"
              className="button button--secondary"
            >
              Open My Forge
            </Link>
          </>
        ) : !playerAccount ? (
          <>
            <strong>No Governor linked</strong>
            <span>
              Link your Player ID in My Forge before using
              any future account-aware redemption tools.
            </span>
            <Link
              to="/my-forge"
              className="button button--secondary"
            >
              Link a Governor
            </Link>
          </>
        ) : (
          <>
            <div className="gift-redemption-panel__player">
              {playerAccount.profile_photo ? (
                <img
                  src={playerAccount.profile_photo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span aria-hidden="true">
                  {playerAccount.player_name
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <div>
                <strong>{playerAccount.player_name}</strong>
                <span>
                  Kingdom {playerAccount.kingdom_id}
                </span>
              </div>
            </div>

            <dl className="gift-redemption-panel__details">
              <div>
                <dt>Player ID</dt>
                <dd>{playerAccount.player_id}</dd>
              </div>
              <div>
                <dt>Identity status</dt>
                <dd>
                  {getVerificationLabel(
                    playerAccount.verification_status,
                  )}
                </dd>
              </div>
            </dl>

            <Link
              to="/my-forge"
              className="gift-redemption-panel__change"
            >
              Review linked Governor
            </Link>
          </>
        )}
      </div>

      <div className="gift-redemption-panel__actions">
        <a
          href={OFFICIAL_REDEMPTION_URL}
          className="button button--primary"
          target="_blank"
          rel="noreferrer"
        >
          Open official redemption page
        </a>

        <p>
          <strong>Automatic redemption is unavailable.</strong>{' '}
          It will remain disabled unless an authorized,
          documented integration and Forge consent controls
          are approved.
        </p>
      </div>
    </section>
  )
}
