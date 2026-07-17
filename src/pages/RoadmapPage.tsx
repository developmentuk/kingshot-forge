import { Link } from "react-router-dom";
import { APP_VERSION } from "../config/release";

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
    version: APP_VERSION,
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
    name: "Production-Ready User Experiences",
    status: "development",
    progress: 0,
    priority: "Next release",
    description:
      "Move from platform foundations towards carefully approved, production-ready user experiences built on the new domain architecture.",
    features: [
      "Player Identity approval and activation plan",
      "Character linking and public profile experience",
      "Hero Showcase experience",
      "Manual Gift Centre redemption interface",
      "Gift eligibility and redemption history",
      "Art Studio gallery and submission workflow",
      "Moderation tools and community publishing controls",
      "Canonical Hero Skills dataset approval",
      "Hero Skills editorial authoring and public views",
      "Google Analytics dashboards",
      "Mobile optimisation and performance improvements",
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
            Release {APP_VERSION} completes the consolidated domain foundations. Release
            0.7.2 now moves towards carefully approved, production-ready user experiences.
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
            <h2>Release 0.7.2 — Production-Ready User Experiences</h2>
            <p>
              The next release will activate selected capabilities only after approval,
              validation and production-safety checks. Player Identity, Gift Centre,
              Art Studio and Hero Skills will advance through small, focused milestones.
            </p>
          </div>
        </div>
        <div className="roadmap-priority-panel__tags">
          <span>Player experience</span>
          <span>Gift Centre</span>
          <span>Art Studio</span>
          <span>Hero Skills</span>
          <span>Mobile and performance</span>
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
