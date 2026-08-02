import { Link } from 'react-router-dom'

function PlayerLookupPage() {
  return (
    <section className="section page-section player-lookup-page">
      <div className="section-heading">
        <p className="eyebrow">Player Lookup</p>
        <h1 className="page-title">Player Lookup is temporarily unavailable</h1>
        <p>
          Forge has disabled public Player Lookup while the player index is
          incomplete. A search result would not reliably represent every
          player already connected to Kingshot Forge.
        </p>
      </div>

      <div className="player-lookup-state" role="status">
        <span aria-hidden="true">🔒</span>
        <h2>Public search is paused</h2>
        <p>
          Private Player Passports are intentionally excluded from public
          search, and Forge does not yet have a complete independent player
          index. The search form and lookup endpoint have therefore been
          disabled rather than returning misleading “no match” results.
        </p>
      </div>

      <div className="player-profile-card__actions">
        <Link className="button button--primary" to="/my-forge/player-identity">
          Open Player Passport
        </Link>
        <Link className="button button--secondary" to="/my-forge">
          Return to My Forge
        </Link>
      </div>

      <div className="compatibility-disclaimer">
        <strong>What still works</strong>
        <p>
          Signed-in players can continue to manage their own Player Passport
          and use the self-reported claim and Forge Vision verification paths.
          Public Player Lookup will return only when Forge can provide a
          dependable and clearly governed index.
        </p>
      </div>
    </section>
  )
}

export default PlayerLookupPage
