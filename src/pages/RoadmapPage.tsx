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
    name: "Editorial Platform Completion",
    status: "development",
    progress: 14,
    priority: "Sprint 9.2 in development",
    description:
      "Complete Domain 0 Editorial Intelligence and Domain 1 Editorial Platform before Player Domain development continues.",
    features: [
      "Project Constitution",
      "Complete registered-dataset audit",
      "Shared editorial platform parity",
      "Verification Centre",
      "Hero Skills canonical evidence workflow",
      "Live dataset health dashboard",
      "Measured domain readiness report",
      "End-to-end desktop, mobile and deployment validation",
    ],
  },
  {
    version: "0.7.x",
    name: "Player Domain Complete",
    status: "planned",
    progress: 0,
    description:
      "Verified player identity, public profiles, linked game data and personalised Forge experiences.",
    features: [
      "Verified player profiles",
      "Linked Kingshot identity",
      "Kingdom and alliance history",
      "Personal dashboard and favourites",
      "Canonical-data-powered progression views",
    ],
  },
  {
    version: "0.8",
    name: "Alliance and Kingdom Domains",
    status: "planned",
    progress: 0,
    description:
      "Complete communities, membership, leadership, administration and shared operational surfaces.",
    features: [
      "Alliance and kingdom pages",
      "Membership and leadership roles",
      "Verified representatives",
      "Community announcements",
      "Shared resources and Discord links",
    ],
  },
  {
    version: "0.9",
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
    version: "1.0",
    name: "The Ultimate Kingshot Companion",
    status: "future",
    progress: 0,
    description:
      "A unified platform for players, alliances and kingdoms, powered by canonical game knowledge and complete community workflows.",
    features: [
      "KvK and event operations",
      "Progression and planning tools",
      "Alliance and kingdom workspaces",
      "Transfer Hub",
      "Community creation and submissions",
      "Notifications and installable mobile experience",
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
            Release {APP_VERSION} completes the Editorial Intelligence and Editorial
            Platform domains before Player Domain development continues.
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
            <h2>Release {APP_VERSION} — Editorial Platform Completion</h2>
            <p>
              Sprint 9.2 completes dataset parity, verification, canonical evidence,
              live health metrics and measurable domain readiness using the existing
              Forge platform architecture.
            </p>
          </div>
        </div>
        <div className="roadmap-priority-panel__tags">
          <span>Editorial Intelligence</span>
          <span>Editorial Platform</span>
          <span>Verification Centre</span>
          <span>Dataset health</span>
          <span>Mobile first</span>
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
          <h2>Help shape what comes next</h2>
          <p>Priorities can evolve through evidence and community feedback, but the active domain will be completed before Forge expands again.</p>
        </div>
        <a className="button button--secondary" href="https://docs.google.com/forms/d/e/1FAIpQLScFO6lIdyTiczPQkSbinR1tGWNXw01opy77VgX1003FF6z86Q/viewform?usp=publish-editor" target="_blank" rel="noreferrer">Send feedback</a>
      </section>
    </section>
  );
}

export default RoadmapPage;
