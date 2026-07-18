import { Link } from "react-router-dom";
import { APP_VERSION, RELEASE_CHANNEL, SHORT_COMMIT_SHA } from "../config/release";

function ReleaseNotesPage() {
  return (
    <section className="section page-section release-notes-page">
      <header className="release-notes-hero">
        <div>
          <p className="eyebrow">Release notes</p>
          <h1 className="page-title">Kingshot Forge release history</h1>
          <p>
            Follow Forge from its governed platform foundations into complete,
            player-facing community tools.
          </p>
        </div>
        <span className="release-notes-version" title={`Commit ${SHORT_COMMIT_SHA}`}>
          {RELEASE_CHANNEL} · v{APP_VERSION}
        </span>
      </header>

      <article className="release-entry release-entry--latest">
        <div className="release-entry__heading">
          <div>
            <span className="release-entry__badge">Latest completed release</span>
            <h2>Release 0.7.4 — Community Art Studio</h2>
            <p>Released 18 July 2026</p>
          </div>
          <Link className="button button--secondary" to="/art-studio">
            Open Art Studio
          </Link>
        </div>
        <div className="release-entry__sections">
          <section>
            <h3>Submit copyable chat art</h3>
            <ul>
              <li>Unicode, emoji, ASCII and box-drawing artwork submissions</li>
              <li>Exact whitespace preview with character and line counts</li>
              <li>Profile, custom-name and anonymous attribution choices</li>
              <li>Personal submission status and clear feedback</li>
            </ul>
          </section>
          <section>
            <h3>Moderate and publish safely</h3>
            <ul>
              <li>Role-gated Community Art moderation in Forge Admin</li>
              <li>Approve, reject, test compatibility and publish workflow</li>
              <li>Published-only gallery with private moderation boundaries</li>
              <li>Creator attribution and positive community reactions</li>
            </ul>
          </section>
          <section>
            <h3>Player experience</h3>
            <ul>
              <li>Stable responsive gallery and loading behaviour</li>
              <li>Search, categories, favourites, preview and Copy Art</li>
              <li>Exact clipboard preservation for Kingshot chat</li>
              <li>Like, Heart, Smile and Wow reactions on published artwork</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>Release 0.7.3 — Forge UX Polish</h2>
            <p>Released July 2026</p>
          </div>
        </div>
        <div className="release-entry__sections">
          <section>
            <h3>Highlights</h3>
            <ul>
              <li>Shared visual tokens and consistent surfaces</li>
              <li>Responsive navigation and mobile touch targets</li>
              <li>Improved focus visibility and reduced-motion support</li>
              <li>Consistent loading, error, empty and success states</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>Release 0.7.2 — Player-Facing Domain Activation</h2>
            <p>Released July 2026</p>
          </div>
        </div>
        <div className="release-entry__sections">
          <section>
            <h3>Highlights</h3>
            <ul>
              <li>Player Identity and Player Passport activation</li>
              <li>Player progression and Hero Showcase journeys</li>
              <li>Manual Gift Centre and published Hero experiences</li>
              <li>Mobile and player-facing domain improvements</li>
            </ul>
          </section>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>Release 0.7.1 — Consolidated Domain Foundations</h2>
            <p>Released 17 July 2026</p>
          </div>
          <Link className="button button--secondary" to="/roadmap">
            View roadmap
          </Link>
        </div>
        <div className="release-entry__sections">
          <section>
            <h3>Platform foundations</h3>
            <ul>
              <li>Verification Centre and editorial governance</li>
              <li>Player Identity, Gift Redemption and Art Studio foundations</li>
              <li>Hero Skills governance and published-data boundaries</li>
              <li>Expanded validation and production safety checks</li>
            </ul>
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
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>Release 0.6.0 — Hero Domain Complete</h2>
            <p>Complete Hero guidance and published-data consumption</p>
          </div>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>v0.5.0 — Forge Admin</h2>
            <p>Admin dashboard, Data Engine and dataset management</p>
          </div>
        </div>
      </article>

      <article className="release-entry">
        <div className="release-entry__heading">
          <div>
            <h2>v0.4.0 — The Forge</h2>
            <p>Authentication, profiles and the original community toolkit</p>
          </div>
        </div>
      </article>
    </section>
  );
}

export default ReleaseNotesPage;
