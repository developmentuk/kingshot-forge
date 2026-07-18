import { Link } from "react-router-dom";

type RoadmapStatus = "live" | "development" | "planned" | "future";

type RoadmapRelease = {
  version: string;
  name: string;
  status: RoadmapStatus;
  progress: number;
  description: string;
  features: string[];
  priority?: string;
};

const roadmapReleases: RoadmapRelease[] = [
  {
    version: "Foundation",
    name: "Forge Platform Foundation",
    status: "live",
    progress: 100,
    priority: "Completed July 2026",
    description:
      "The shared platform foundation for trustworthy data, governed editing, publishing, permissions and production delivery is complete.",
    features: [
      "Authentication and Forge roles",
      "Supabase persistence and server-side security",
      "Kingshot Data Engine and dataset contracts",
      "Draft, review, approval and publishing workflows",
      "Audit history, rollback and governance standards",
      "Publish once, consume everywhere architecture",
    ],
  },
  {
    version: "0.7.1",
    name: "Consolidated Domain Foundations",
    status: "live",
    progress: 100,
    priority: "Released 17 July 2026",
    description:
      "Production-shaped foundations for verification, player identity, gift redemption, community artwork and Hero Skills governance.",
    features: [
      "Verification Centre",
      "Player Identity Foundation",
      "Gift Redemption Foundation",
      "Community Art Studio Foundation",
      "Hero Skills Governance",
      "Expanded validation and release safety checks",
    ],
  },
  {
    version: "0.7.2",
    name: "Player-Facing Domain Activation",
    status: "live",
    progress: 100,
    priority: "Completed July 2026",
    description:
      "Activated selected player-facing journeys on the existing governed domain architecture.",
    features: [
      "Player Identity and Player Passport",
      "Player progression and Hero Showcase",
      "Manual Gift Centre experience",
      "Published Hero experiences",
      "Mobile and player-facing domain improvements",
    ],
  },
  {
    version: "0.7.3",
    name: "Forge UX Polish",
    status: "live",
    progress: 100,
    priority: "Completed July 2026",
    description:
      "Refined the shared Forge experience with consistent navigation, controls, responsive surfaces and accessible states.",
    features: [
      "Shared visual tokens and surface patterns",
      "Responsive desktop and mobile navigation",
      "Consistent page headers, buttons and forms",
      "Loading, empty, error and success state polish",
      "Focus visibility and reduced-motion support",
    ],
  },
  {
    version: "0.7.4",
    name: "Community Art Studio",
    status: "live",
    progress: 100,
    priority: "Released 18 July 2026",
    description:
      "A production-ready text-art submission, moderation, publication and community-reaction workflow.",
    features: [
      "Copyable Unicode and emoji chat-art submissions",
      "Whitespace-preserving editor and preview",
      "Personal submission status",
      "Authorised moderation and publication",
      "Published-only public gallery",
      "Creator attribution and positive reactions",
      "Stable responsive loading and layout",
    ],
  },
  {
    version: "0.7.5",
    name: "Auto Redeem",
    status: "development",
    progress: 100,
    priority: "Ready for Clark’s final production validation",
    description:
      "Locally validated release candidate for safe, consented gift-code redemption; production enablement remains gated pending Clark’s final validation.",
    features: [
      "Governed active gift-code registry",
      "Explicit linked-player consent",
      "User-triggered redeem-all workflow",
      "Per-code success and failure results",
      "Server-side provider integration",
      "Rate limits, safe retries and audit trail",
      "Redemption history and privacy boundaries",
    ],
  },
  {
    version: "0.8.0",
    name: "Forge Operations Centre",
    status: "development",
    progress: 50,
    priority: "Active major milestone",
    description:
      "Separate Player View from internal tooling with role-aware workspaces, coherent operations navigation and the Forge Identity/User Management foundation.",
    features: [
      "Player View separation and workspace switcher",
      "Forge Operations Centre",
      "Contributor and Creator Centre shell",
      "Moderation Centre shell",
      "Server-authorized User Management list and detail projections",
      "Multi-role capability resolution and audited role/status mutations",
      "Player View Settings Centre and safe workspace preference handling",
      "Admin feature inventory and release security audit",
      "Responsive internal UX standards",
      "Forge Contributor role catalogue and public Join Forge pages",
      "Contributor governance policy drafts",
      "Secure application workflow and Operations review remain in development",
    ],
  },
  {
    version: "0.8.1",
    name: "Automatic Gift Code Processing",
    status: "planned",
    progress: 0,
    description:
      "Complete verified player identity and linked-account foundations required by personal and operational Forge services.",
    features: [
      "Verified player profiles",
      "Linked Kingshot identity",
      "Kingdom and alliance history",
      "Personal dashboard and favourites",
      "Consent and account controls",
    ],
  },
  {
    version: "0.9.0",
    name: "Alliance and Kingdom Foundations",
    status: "planned",
    progress: 0,
    description:
      "Complete communities, membership, leadership and operational scoping before shared KvK workflows are introduced.",
    features: [
      "Alliance and kingdom pages",
      "Membership and leadership roles",
      "Verified representatives",
      "Community announcements",
      "Shared resources and Discord links",
    ],
  },
  {
    version: "0.9.5",
    name: "Transfer Hub",
    status: "planned",
    progress: 0,
    description:
      "Recruitment, transfer applications, eligibility, invitations, passes and movement history.",
    features: [
      "Player transfer profiles",
      "Alliance and kingdom recruitment",
      "Eligibility tracking",
      "Invitation and pass management",
      "Transfer workflow and history",
    ],
  },
  {
    version: "1.0.0",
    name: "KvK and Event Operations",
    status: "future",
    progress: 0,
    description:
      "Native Forge coordination tools adapted and expanded from community-proven operational concepts.",
    features: [
      "KvK preparation campaigns and scoring",
      "Resource and speed-up pledges",
      "Alliance and kingdom readiness summaries",
      "Battle attendance and war-room workflows",
      "Royal buff and rally coordination",
    ],
  },
  {
    version: "Future",
    name: "Forge Screenshot Intelligence Engine",
    status: "future",
    progress: 0,
    priority: "Future platform capability",
    description:
      "A future human-reviewed screenshot intelligence capability. It is explicitly out of scope for Release 0.7.0 Sprint 9.2.",
    features: [
      "Kingshot screenshot classification",
      "OCR-assisted player-stat, hero and progression import",
      "Artwork extraction and automatic image alignment",
      "Renderer comparison with human review and confidence scoring",
    ],
  },
];

function getStatusLabel(status: RoadmapStatus) {
  switch (status) {
    case "live":
      return "Complete";
    case "development":
      return "In development";
    case "planned":
      return "Planned";
    default:
      return "Future release";
  }
}

function RoadmapPage() {
  return (
    <section className="section page-section product-roadmap">
      <header className="product-roadmap__hero">
        <div>
          <p className="eyebrow">Product roadmap</p>
          <h1 className="page-title">Build each domain completely</h1>
          <p>
            Community Art Studio is complete. Release 0.7.5 now focuses entirely on safe,
            consented Auto Redeem for linked Kingshot players.
          </p>
        </div>
        <div className="product-roadmap__hero-actions">
          <Link className="button button--primary" to="/release-notes">Read release notes</Link>
          <Link className="button button--secondary" to="/gift-codes">Open Gift Codes</Link>
        </div>
      </header>

      <section className="roadmap-priority-panel">
        <div>
          <span className="roadmap-priority-panel__icon">🎁</span>
          <div>
            <p className="eyebrow">Release candidate status</p>
            <h2>Release 0.7.5 — Auto Redeem</h2>
            <p>
              Release candidate ready for Clark’s final production validation. The secure,
              transparent redemption journey remains paused until production checks pass.
            </p>
          </div>
        </div>
        <div className="roadmap-priority-panel__tags">
          <span>Linked player consent</span>
          <span>Redeem all</span>
          <span>Per-code results</span>
          <span>Rate limiting</span>
          <span>Audit history</span>
          <span>Privacy</span>
        </div>
      </section>

      <div className="product-roadmap__timeline">
        {roadmapReleases.map((release) => (
          <article className={`roadmap-release roadmap-release--${release.status}`} key={release.version}>
            <div className="roadmap-release__header">
              <div className="roadmap-release__version">
                <span>{release.version === "Foundation" ? "Phase" : "Version"} {release.version}</span>
                <h2>{release.name}</h2>
              </div>
              <div className="roadmap-release__status-wrap">
                {release.priority && <span className="roadmap-release__priority">{release.priority}</span>}
                <span className={`roadmap-release__status roadmap-release__status--${release.status}`}>
                  {getStatusLabel(release.status)}
                </span>
              </div>
            </div>
            <p className="roadmap-release__description">{release.description}</p>
            <div className="roadmap-release__progress">
              <div className="roadmap-release__progress-heading"><span>Release progress</span><strong>{release.progress}%</strong></div>
              <div className="roadmap-release__progress-track"><span style={{ width: `${release.progress}%` }} /></div>
            </div>
            <div className="roadmap-release__features">
              {release.features.map((feature) => (
                <div key={feature}><span aria-hidden="true">{release.status === "live" ? "✓" : "→"}</span><span>{feature}</span></div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <section className="roadmap-community-note">
        <div>
          <p className="eyebrow">Community-led development</p>
          <h2>Built around real player needs</h2>
          <p>Forge prioritises the tools players actively request and completes them as safe, production-ready vertical slices.</p>
        </div>
        <a className="button button--secondary" href="https://docs.google.com/forms/d/e/1FAIpQLScFO6lIdyTiczPQkSbinR1tGWNXw01opy77VgX1003FF6z86Q/viewform?usp=publish-editor" target="_blank" rel="noreferrer">Send feedback</a>
      </section>
    </section>
  );
}

export default RoadmapPage;
