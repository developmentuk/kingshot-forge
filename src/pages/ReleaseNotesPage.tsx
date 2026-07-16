import { Link } from "react-router-dom";

function ReleaseNotesPage() {
  return (
    <section className="section page-section release-notes-page">
      <header className="release-notes-hero">
        <div>
          <p className="eyebrow">Release notes</p>
          <h1 className="page-title">Foundation Phase complete</h1>
          <p>
            Kingshot Forge now has the shared platform, governance and
            production workflow required to build complete product domains.
            Release 0.6.0 begins with the Hero Domain and Sprint 8.1: Hero
            Skills.
          </p>
        </div>
        <span className="release-notes-version">Release 0.6.0 kick-off</span>
      </header>

      <article className="release-entry release-entry--latest">
        <div className="release-entry__heading">
          <div>
            <span className="release-entry__badge">Latest milestone</span>
            <h2>Foundation Close-Out</h2>
            <p>Completed 16 July 2026</p>
          </div>
          <Link className="button button--secondary" to="/roadmap">
            View roadmap
          </Link>
        </div>

        <div className="release-entry__sections">
          <section>
            <h3>Platform completed</h3>
            <ul>
              <li>Authentication and Forge role model</li>
              <li>Supabase persistence and server-side security</li>
              <li>Kingshot Data Engine and dataset contracts</li>
              <li>Reusable dataset adapters and validation</li>
              <li>Structured Record Editor</li>
              <li>Draft, review and approval workflow</li>
              <li>Immutable versions, history and comparison</li>
              <li>Publication queue and scheduled publishing foundations</li>
              <li>Archive, restore and rollback</li>
              <li>Audit events and optimistic concurrency</li>
            </ul>
          </section>

          <section>
            <h3>Validated end to end</h3>
            <ul>
              <li>Authenticated preview sign-in and owner permissions</li>
              <li>Hero draft creation and immutable version history</li>
              <li>Review, approval and publication transitions</li>
              <li>Manual publication queue processing</li>
              <li>Archive, restore and rollback workflows</li>
              <li>Dirty-form protection during refresh and tab switching</li>
              <li>Optimistic concurrency rejection for stale saves</li>
              <li>Vercel-compatible editorial API execution</li>
            </ul>
          </section>

          <section>
            <h3>Governance added</h3>
            <ul>
              <li>Forge Blueprint and domain roadmap</li>
              <li>Epic → Sprint → Release methodology</li>
              <li>Complete vertical slice Definition of Done</li>
              <li>Shared platform capability principles</li>
              <li>Documentation, testing and release standards</li>
              <li>ADR-001: Publish once, consume everywhere</li>
              <li>Hero Domain designated as the reference implementation</li>
            </ul>
          </section>

          <section>
            <h3>Release 0.6.0 begins</h3>
            <ul>
              <li>Epic 2: Hero Domain Complete</li>
              <li>Sprint 8.1: Hero Skills</li>
              <li>Canonical structured skill records</li>
              <li>Skill editing through the existing editorial platform</li>
              <li>Publication through the existing workflow</li>
              <li>Published skills consumed everywhere Hero data appears</li>
              <li>No architecture redesign or parallel content source</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>v0.5.0 — Forge Admin</h2>
            <p>Previous live platform milestone</p>
          </div>
        </div>
        <div className="release-entry__sections">
          <section>
            <h3>Highlights</h3>
            <ul>
              <li>Forge Admin dashboard</li>
              <li>Live Kingshot Data Engine</li>
              <li>Reusable dataset browser</li>
              <li>Live Heroes and Events datasets</li>
              <li>Dataset record detail viewer</li>
              <li>Dataset adapter and importer foundations</li>
              <li>Source provenance and confidence metadata</li>
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
              <li>Google authentication and Forge profiles</li>
              <li>Linked Kingshot player accounts</li>
              <li>Player Lookup and Active Gift Codes</li>
              <li>Kingdom Explorer and KvK match history</li>
              <li>Supabase integration and responsive application shell</li>
            </ul>
          </section>
        </div>
      </article>
    </section>
  );
}

export default ReleaseNotesPage;
