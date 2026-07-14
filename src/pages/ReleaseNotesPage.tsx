import { Link } from "react-router-dom";

function ReleaseNotesPage() {
  return (
    <section className="section page-section release-notes-page">
      <header className="release-notes-hero">
        <div>
          <p className="eyebrow">Release notes</p>

          <h1 className="page-title">
            Kingshot Forge v0.5.0
          </h1>

          <p>
            Forge Admin introduces the first live version of the
            Kingshot Data Engine, including reusable dataset
            browsers, live Heroes and Events data, source metadata
            and the foundation of a complete Kingshot content
            management system.
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

            <h2>v0.5.0 — Forge Admin</h2>

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
              <li>Forge Admin dashboard</li>
              <li>Live Kingshot Data Engine</li>
              <li>Reusable dataset browser</li>
              <li>Live Heroes dataset with 27 records</li>
              <li>Live recurring Events dataset</li>
              <li>Dataset record detail viewer</li>
              <li>Dataset adapter framework</li>
              <li>Frontend dataset adapter registry</li>
              <li>Data Engine dataset API endpoint</li>
              <li>Events importer and normalisation pipeline</li>
              <li>Tier badges with explanatory tooltips</li>
            </ul>
          </section>

          <section>
            <h3>Improved</h3>

            <ul>
              <li>Admin navigation and route handling</li>
              <li>Responsive admin layouts</li>
              <li>Dataset search</li>
              <li>Sortable table columns</li>
              <li>Pagination controls</li>
              <li>Record totals and status displays</li>
              <li>Source metadata handling</li>
              <li>Dataset field normalisation</li>
              <li>Error states and demo-data fallback</li>
              <li>React Router configuration consistency</li>
            </ul>
          </section>

          <section>
            <h3>Platform foundation</h3>

            <ul>
              <li>Generic importer architecture</li>
              <li>Normalised dataset model</li>
              <li>Duplicate record-key validation</li>
              <li>Reusable Data Engine client</li>
              <li>Dataset-specific presentation adapters</li>
              <li>Extensible dataset registry</li>
              <li>Live source fetching and hashing</li>
              <li>Source provenance and confidence metadata</li>
              <li>Foundation for editing and publishing workflows</li>
            </ul>
          </section>

          <section>
            <h3>Coming next</h3>

            <ul>
              <li>Record editing</li>
              <li>Import Manager</li>
              <li>Dataset version history</li>
              <li>Visual change comparison</li>
              <li>Global dataset search</li>
              <li>Buildings dataset</li>
              <li>Governor Gear dataset</li>
              <li>Troops dataset</li>
              <li>Truegold dataset</li>
              <li>VIP and War Academy datasets</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>v0.4.0 — The Forge</h2>

            <p>Previous community platform milestone</p>
          </div>
        </div>

        <div className="release-entry__sections">
          <section>
            <h3>Highlights</h3>

            <ul>
              <li>Google authentication</li>
              <li>Forge user profiles</li>
              <li>Linked Kingshot player accounts</li>
              <li>Player Lookup</li>
              <li>Active Gift Codes</li>
              <li>Kingdom Explorer</li>
              <li>KvK match tracker</li>
              <li>Supabase database integration</li>
              <li>Role and permissions foundation</li>
              <li>Improved mobile experience</li>
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
  );
}

export default ReleaseNotesPage;