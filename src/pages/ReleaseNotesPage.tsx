import { Link } from 'react-router'

function ReleaseNotesPage() {
  return (
    <section className="section page-section release-notes-page">
      <header className="release-notes-hero">
        <div>
          <p className="eyebrow">Release notes</p>

          <h1 className="page-title">
            Kingshot Forge v0.4.0
          </h1>

          <p>
            The Forge release introduces live Kingshot data,
            player identities, community accounts and a much
            stronger mobile experience.
          </p>
        </div>

        <span className="release-notes-version">
          Community Beta
        </span>
      </header>

      <article className="release-entry release-entry--latest">
        <div className="release-entry__heading">
          <div>
            <span className="release-entry__badge">
              Latest release
            </span>

            <h2>v0.4.0 — The Forge</h2>

            <p>Released July 2026</p>
          </div>

          <Link
            className="button button--secondary"
            to="/roadmap"
          >
            View roadmap
          </Link>
        </div>

        <div className="release-entry__sections">
          <section>
            <h3>Added</h3>

            <ul>
              <li>Google authentication</li>
              <li>Forge user profiles</li>
              <li>Linked Kingshot player accounts</li>
              <li>Kingshot player avatar and identity</li>
              <li>Player Lookup</li>
              <li>Active Gift Codes</li>
              <li>Kingdom Explorer</li>
              <li>KvK match tracker</li>
              <li>Supabase database integration</li>
              <li>Role and permissions foundation</li>
            </ul>
          </section>

          <section>
            <h3>Improved</h3>

            <ul>
              <li>Mobile navigation and responsive layouts</li>
              <li>Homepage dashboard</li>
              <li>Name Forge mobile layout</li>
              <li>Art and Chat Forge usability</li>
              <li>My Forge account experience</li>
              <li>Navigation across API-powered pages</li>
              <li>Community artwork support</li>
            </ul>
          </section>

          <section>
            <h3>Platform foundation</h3>

            <ul>
              <li>Supabase Edge Functions</li>
              <li>KingShot.net API integration</li>
              <li>Profile and player account tables</li>
              <li>Public and private player visibility</li>
              <li>Verification-status framework</li>
              <li>Community submissions groundwork</li>
            </ul>
          </section>

          <section>
            <h3>Coming next</h3>

            <ul>
              <li>KingshotPro data integration</li>
              <li>KvK preparation calculator</li>
              <li>Live event scoreboards</li>
              <li>Transfer application management</li>
              <li>Kingdom and alliance directories</li>
              <li>Push notifications</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>v0.3.0 — Community Foundation</h2>
            <p>Previous beta milestone</p>
          </div>
        </div>

        <div className="release-entry__sections">
          <section>
            <h3>Highlights</h3>

            <ul>
              <li>Community artwork support</li>
              <li>Google feedback form</li>
              <li>Supabase project connection</li>
              <li>Account and role foundations</li>
              <li>Responsive application shell</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>v0.2.0 — Public Beta</h2>
            <p>First public development release</p>
          </div>
        </div>

        <div className="release-entry__sections">
          <section>
            <h3>Highlights</h3>

            <ul>
              <li>Name Studio</li>
              <li>Art Studio</li>
              <li>Chat Studio</li>
              <li>Character Library</li>
              <li>Compatibility tools</li>
              <li>My Forge</li>
            </ul>
          </section>
        </div>
      </article>
    </section>
  )
}

export default ReleaseNotesPage