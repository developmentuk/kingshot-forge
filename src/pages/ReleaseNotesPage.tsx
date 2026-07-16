import { Link } from "react-router-dom";
import { APP_VERSION, RELEASE_CHANNEL, SHORT_COMMIT_SHA } from "../config/release";

function ReleaseNotesPage() {
  return (
    <section className="section page-section release-notes-page">
      <header className="release-notes-hero">
        <div>
          <p className="eyebrow">Release notes</p>
          <h1 className="page-title">Release {APP_VERSION} — Editorial Platform Completion</h1>
          <p>
            This release completes the Editorial Intelligence and Editorial Platform
            foundations before Player Domain development continues.
          </p>
        </div>
        <span className="release-notes-version" title={`Commit ${SHORT_COMMIT_SHA}`}>
          {RELEASE_CHANNEL} · v{APP_VERSION}
        </span>
      </header>

      <article className="release-entry release-entry--latest">
        <div className="release-entry__heading">
          <div>
            <span className="release-entry__badge">Current release</span>
            <h2>Sprint 9.2 — Editorial Platform Completion</h2>
            <p>Milestone-first development on the active release branch</p>
          </div>
          <Link className="button button--secondary" to="/roadmap">
            View roadmap
          </Link>
        </div>

        <div className="release-entry__sections">
          <section>
            <h3>Release objectives</h3>
            <ul>
              <li>Authoritative Forge project constitution</li>
              <li>Evidence-based audit of every registered dataset</li>
              <li>Complete shared editorial workflows</li>
              <li>Verification Centre and confidence model</li>
              <li>Canonical Hero Skills evidence workflow</li>
              <li>Live dataset health and domain readiness reporting</li>
            </ul>
          </section>

          <section>
            <h3>Release identity</h3>
            <ul>
              <li>Version is read from the canonical package metadata</li>
              <li>Production and preview channels are identified automatically</li>
              <li>Deployed commit metadata is injected by Vercel</li>
              <li>Visible version labels share one application configuration</li>
            </ul>
          </section>

          <section>
            <h3>Quality gates</h3>
            <ul>
              <li>Complete repository checks pass</li>
              <li>The exact branch commit deploys successfully</li>
              <li>Desktop and mobile workflows are smoke-tested</li>
              <li>Canonical published data is used by public consumers</li>
              <li>Documentation and release records match production</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>Release 0.6.0 — Hero Domain Complete</h2>
            <p>Sprint 8.2 reference-domain milestone</p>
          </div>
        </div>
        <div className="release-entry__sections">
          <section>
            <h3>Complete Hero guidance</h3>
            <ul>
              <li>Hero strengths, weaknesses and best-use guidance</li>
              <li>Published-data-driven Hero synergies</li>
              <li>Recommended formations and troop focus</li>
              <li>Hero progression, Widget and Exclusive Gear guidance</li>
              <li>Responsive Hero catalogue and detail experience</li>
            </ul>
          </section>
          <section>
            <h3>Canonical consumption</h3>
            <ul>
              <li>Published Hero catalogue and Hero Skills only</li>
              <li>Draft and rejected records excluded from public pages</li>
              <li>No parallel editorial system or replacement tables</li>
              <li>Loading, unavailable, not-found and empty states</li>
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
