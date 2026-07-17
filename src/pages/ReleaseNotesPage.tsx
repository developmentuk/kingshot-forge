import { Link } from "react-router-dom";
import { APP_VERSION, RELEASE_CHANNEL, SHORT_COMMIT_SHA } from "../config/release";

function ReleaseNotesPage() {
  return (
    <section className="section page-section release-notes-page">
      <header className="release-notes-hero">
        <div>
          <p className="eyebrow">Release notes</p>
          <h1 className="page-title">Release {APP_VERSION} — Consolidated Domain Foundations</h1>
          <p>
            The largest architectural milestone for Kingshot Forge to date, establishing the
            production-shaped foundations for Player Identity, Gift Redemption, Art Studio,
            Hero Skills governance and Verification Centre workflows.
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
            <h2>Release 0.7.1 — Consolidated Domain Foundations</h2>
            <p>Released 17 July 2026</p>
          </div>
          <Link className="button button--secondary" to="/roadmap">
            View roadmap
          </Link>
        </div>

        <div className="release-entry__sections">
          <section>
            <h3>Verification Centre</h3>
            <ul>
              <li>Editorial verification and dataset governance framework</li>
              <li>Source evidence, confidence and approval foundations</li>
              <li>Production-shaped workflows kept safely disabled</li>
            </ul>
          </section>

          <section>
            <h3>Player Identity</h3>
            <ul>
              <li>Character identity and Active Character model</li>
              <li>Public and private identity boundaries</li>
              <li>Hero Showcase ownership and verification foundations</li>
              <li>Privacy-first integration contracts</li>
            </ul>
          </section>

          <section>
            <h3>Gift Redemption</h3>
            <ul>
              <li>Provider abstraction and eligibility engine</li>
              <li>Consent, safety and redemption workflow contracts</li>
              <li>Privacy-safe Player Identity integration</li>
              <li>Automatic redemption remains disabled</li>
            </ul>
          </section>

          <section>
            <h3>Art Studio</h3>
            <ul>
              <li>Community artwork security model</li>
              <li>Public-safe creator attribution</li>
              <li>Moderation and publication architecture</li>
              <li>Community publishing remains disabled</li>
            </ul>
          </section>

          <section>
            <h3>Hero Skills governance</h3>
            <ul>
              <li>Source evidence validation and stable identifiers</li>
              <li>Editorial approval and dataset governance</li>
              <li>No Hero Skill data invented or published</li>
            </ul>
          </section>

          <section>
            <h3>Platform improvements</h3>
            <ul>
              <li>Improved modular domain architecture</li>
              <li>Stronger privacy and capability boundaries</li>
              <li>Expanded automated validation and integration testing</li>
              <li>Improved NodeNext and production build validation</li>
            </ul>
          </section>

          <section>
            <h3>Safety state</h3>
            <ul>
              <li>Player Identity, Gift Redemption and Art Studio capabilities remain OFF</li>
              <li>Hero Skills remain source-gated and unpublished</li>
              <li>No production migrations were applied</li>
              <li>No production data, grants or RLS policies were changed</li>
              <li>No external product providers were contacted</li>
            </ul>
          </section>

          <section>
            <h3>Looking ahead</h3>
            <p>
              Release 0.7.2 will move from platform foundations towards carefully approved,
              production-ready user experiences built on these systems.
            </p>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>Release 0.7.0 — Editorial Platform Completion</h2>
            <p>Editorial Intelligence and shared platform milestone</p>
          </div>
        </div>
        <div className="release-entry__sections">
          <section>
            <h3>Highlights</h3>
            <ul>
              <li>Authoritative Forge project constitution</li>
              <li>Evidence-based audit of registered datasets</li>
              <li>Complete shared editorial workflows</li>
              <li>Verification Centre and confidence model</li>
              <li>Canonical Hero Skills evidence workflow</li>
              <li>Live dataset health and domain readiness reporting</li>
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
