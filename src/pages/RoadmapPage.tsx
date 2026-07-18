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
      "Reusable dataset adapters and validation",
      "Structured Record Editor",
      "Draft, review and approval workflow",
      "Immutable version history and comparison",
      "Publication queue and scheduled publishing foundations",
      "Archive, restore and rollback",
      "Audit events and optimistic concurrency",
      "Governance, testing and release standards",
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
      "Production-shaped foundations for verification, player identity, gift redemption, community artwork and Hero Skills governance, with all new capabilities safely disabled.",
    features: [
      "Editorial Platform",
      "Dataset Framework",
      "Verification Centre",
      "Hero Skills Governance",
      "Player Identity Foundation",
      "Gift Redemption Foundation",
      "Community Art Studio Foundation",
      "Privacy-safe domain integration boundaries",
      "Expanded validation and release safety checks",
    ],
  },
  {
    version: "0.7.2",
    name: "Player-Facing Domain Activation",
    status: "development",
    progress: 5,
    priority: "Current release",
    description:
      "Activate selected player-facing journeys on the existing domain architecture, using published datasets and approval-gated capabilities.",
    features: [
      "Release metadata and version integrity",
      "Player Identity activation",
      "Character linking and public profile experience",
      "Hero Showcase experience",
      "Manual Gift Centre redemption interface",
      "Gift eligibility and redemption history",
      "Art Studio gallery and submission workflow",
      "Moderation tools and community publishing controls",
      "Verification Centre player-facing improvements",
      "Published Hero Skills experience",
      "Google Analytics dashboards",
      "Mobile optimisation and performance improvements",
    ],
  },
  {
    version: "0.7.3",
    name: "Forge UX Polish",
    status: "development",
    progress: 20,
    priority: "Current milestone",
    description:
      "Refine the shared Forge experience with consistent navigation, controls, responsive surfaces, accessible states and restrained interaction polish.",
    features: [
      "Shared visual tokens and surface patterns",
      "Responsive desktop and mobile navigation",
      "Consistent page headers, buttons and forms",
      "Loading, empty, error and success state polish",
      "Focus visibility and reduced-motion support",
      "My Forge, Player Passport and public-page refinement",
    ],
  },
  {
    version: "0.8.0",
    name: "Player Domain Complete",
    status: "planned",
    progress: 0,
    description:
      "Complete verified player identity and linked account foundations required by personal and operational Forge services.",
    features: [
      "Verified player profiles",
      "Linked Kingshot identity",
      "Kingdom and alliance history",
      "Personal dashboard and favourites",
      "Canonical-data-powered progression views",
      "Consent and account controls for future automated services",
    ],
  },
  {
    version: "0.8.5",
    name: "Gift Centre",
    status: "planned",
    progress: 0,
    priority: "Accelerated community priority",
    description:
      "The first Forge Operations vertical slice: discover, verify and safely redeem gift codes for consented linked player accounts.",
    features: [
      "Governed gift-code registry",
      "Code discovery, validation and expiry state",
      "Explicit linked-player redemption consent",
      "Server-side auto redeem",
      "Normalised success and failure outcomes",
      "Player redemption history",
      "Rate limits, safe retries and audit trail",
      "Notification foundations",
      "Original concepts and engineering inspiration credited to Sir Flux",
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
      "Operations permissions and audit boundaries",
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
      "Native Forge coordination tools adapted and expanded from community-proven operational concepts contributed by Sir Flux.",
    features: [
      "KvK preparation campaigns and canonical scoring",
      "Resource and speed-up pledges",
      "Alliance and kingdom readiness summaries",
      "Battle-segment attendance and war room",
      "Royal buff scheduling",
      "Coordinated rally timing",
      "Discord integration, reminders and operational history",
    ],
  },
  {
    version: "1.1.0",
    name: "Progression, Intelligence and Planning",
    status: "future",
    progress: 0,
    description:
      "Explainable calculators, forecasts and recommendations powered by published canonical and authorised operational data.",
    features: [
      "Building, troop and research planning",
      "Gear, charm and VIP progression",
      "Event preparation forecasts",
      "Alliance and kingdom readiness intelligence",
      "Explainable recommendations",
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
            Release 0.7.2 activated the accepted player-facing journeys. Release 0.7.3 now
            polishes the shared Forge experience without changing product scope.
          </p>
        </div>
        <div className="product-roadmap__hero-actions">
          <Link className="button button--primary" to="/release-notes">Read release notes</Link>
          <Link className="button button--secondary" to="/admin/datasets">Open datasets</Link>
        </div>
      </header>

      <section className="roadmap-priority-panel">
        <div>
          <span className="roadmap-priority-panel__icon">⚒️</span>
          <div>
            <p className="eyebrow">Current development priority</p>
            <h2>Release 0.7.3 — Forge UX Polish</h2>
            <p>
              The existing Forge journeys are being refined through focused visual,
              responsive and accessibility improvements. No new domain or schema change is
              part of this milestone.
            </p>
          </div>
        </div>
        <div className="roadmap-priority-panel__tags">
          <span>Shared surfaces</span>
          <span>Navigation</span>
          <span>Forms and controls</span>
          <span>Accessibility</span>
          <span>Responsive layouts</span>
          <span>Player-facing polish</span>
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
                <span className={`roadmap-release__status roadmap-release__status--${release.status}`}>{getStatusLabel(release.status)}</span>
              </div>
            </div>
            <p className="roadmap-release__description">{release.description}</p>
            <div className="roadmap-release__progress">
              <div className="roadmap-release__progress-heading"><span>Release progress</span><strong>{release.progress}%</strong></div>
              <div className="roadmap-release__progress-track"><span style={{ width: `${release.progress}%` }} /></div>
            </div>
            <div className="roadmap-release__features">
              {release.features.map((feature) => <div key={feature}><span aria-hidden="true">{release.status === "live" ? "✓" : "→"}</span><span>{feature}</span></div>)}
            </div>
          </article>
        ))}
      </div>

      <section className="roadmap-community-note">
        <div>
          <p className="eyebrow">Community-led development</p>
          <h2>Built with community contributions</h2>
          <p>Forge adapts approved community concepts natively, protects its shared architecture and gives visible credit to contributors such as Sir Flux.</p>
        </div>
        <a className="button button--secondary" href="https://docs.google.com/forms/d/e/1FAIpQLScFO6lIdyTiczPQkSbinR1tGWNXw01opy77VgX1003FF6z86Q/viewform?usp=publish-editor" target="_blank" rel="noreferrer">Send feedback</a>
      </section>
    </section>
  );
}

export default RoadmapPage;
