import { Link } from "react-router-dom";

function ReleaseNotesPage() {
  return (
    <section className="section page-section release-notes-page">
      <header className="release-notes-hero">
        <div>
          <p className="eyebrow">Release notes</p>
          <h1 className="page-title">Release 0.6.0 — Hero Domain Complete</h1>
          <p>
            The Hero Companion now combines the published Hero catalogue and
            published Hero Skills into a complete, responsive guidance
            experience built on the existing Forge editorial platform.
          </p>
        </div>
        <span className="release-notes-version">Sprint 8.2 ready for validation</span>
      </header>

      <article className="release-entry release-entry--latest">
        <div className="release-entry__heading">
          <div>
            <span className="release-entry__badge">Latest milestone</span>
            <h2>Sprint 8.2 — Hero Domain Completion</h2>
            <p>Completed in repository on 16 July 2026</p>
          </div>
          <Link className="button button--secondary" to="/roadmap">
            View roadmap
          </Link>
        </div>

        <div className="release-entry__sections">
          <section>
            <h3>Complete Hero guidance</h3>
            <ul>
              <li>Hero strengths and weaknesses</li>
              <li>Published-data-driven Hero synergies</li>
              <li>Recommended formation roles and troop focus</li>
              <li>Best-use editorial guidance</li>
              <li>Hero progression recommendations</li>
              <li>Widget investment guidance</li>
              <li>Exclusive Gear investment guidance</li>
            </ul>
          </section>

          <section>
            <h3>Published once, consumed everywhere</h3>
            <ul>
              <li>Active Heroes remain sourced from the published Hero catalogue</li>
              <li>Hero Skills remain sourced from the published-only projection</li>
              <li>Draft and rejected content is never read by public Hero pages</li>
              <li>No replacement tables or parallel editorial system</li>
              <li>No invented material costs or unpublished breakpoints</li>
            </ul>
          </section>

          <section>
            <h3>Mobile and usability</h3>
            <ul>
              <li>Responsive Hero catalogue and detail layouts</li>
              <li>Sticky, horizontally scrollable section navigation</li>
              <li>Touch-sized navigation controls</li>
              <li>Responsive synergy, formation and progression cards</li>
              <li>Loading, unavailable, not-found and empty states</li>
              <li>Integrated Hero issue reporting</li>
            </ul>
          </section>

          <section>
            <h3>Release validation gate</h3>
            <ul>
              <li>Run the complete repository check</li>
              <li>Deploy the exact branch head to Vercel</li>
              <li>Smoke-test desktop and mobile Hero journeys</li>
              <li>Verify published and unpublished Hero Skill behaviour</li>
              <li>Merge and tag v0.6.0 only after acceptance</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>Sprint 8.1 — Hero Skills</h2>
            <p>Canonical vertical slice</p>
          </div>
        </div>
        <div className="release-entry__sections">
          <section>
            <h3>Highlights</h3>
            <ul>
              <li>Canonical structured Hero Skill records</li>
              <li>Schema-driven editing and validation</li>
              <li>Draft, review, approval and publication</li>
              <li>Immutable history, comparison and rollback</li>
              <li>Published-only public Hero Skill projection</li>
              <li>Server-side permissions and RLS</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>Foundation Phase</h2>
            <p>Completed 16 July 2026</p>
          </div>
        </div>
        <div className="release-entry__sections">
          <section>
            <h3>Platform completed</h3>
            <ul>
              <li>Authentication and Forge role model</li>
              <li>Supabase persistence and server-side security</li>
              <li>Kingshot Data Engine and dataset contracts</li>
              <li>Structured Record Editor</li>
              <li>Governed editorial workflow</li>
              <li>Immutable versions, history and rollback</li>
              <li>Publication queue and audit architecture</li>
              <li>Optimistic concurrency and conflict recovery</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading"><div><h2>v0.5.0 — Forge Admin</h2><p>Previous live platform milestone</p></div></div>
        <div className="release-entry__sections"><section><h3>Highlights</h3><ul><li>Forge Admin dashboard</li><li>Live Kingshot Data Engine</li><li>Reusable dataset browser</li><li>Live Heroes and Events datasets</li><li>Dataset adapters and provenance metadata</li></ul></section></div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading"><div><h2>v0.4.0 — The Forge</h2><p>Previous community platform milestone</p></div></div>
        <div className="release-entry__sections"><section><h3>Highlights</h3><ul><li>Google authentication and Forge profiles</li><li>Linked Kingshot player accounts</li><li>Player Lookup and Active Gift Codes</li><li>Kingdom Explorer and KvK match history</li><li>Supabase integration and responsive application shell</li></ul></section></div>
      </article>
    </section>
  );
}

export default ReleaseNotesPage;
