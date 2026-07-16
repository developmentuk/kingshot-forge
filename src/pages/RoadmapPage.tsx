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
    version: "0.6.0",
    name: "Hero Domain Complete",
    status: "development",
    progress: 5,
    priority: "Current release",
    description:
      "The Hero Domain becomes the complete reference implementation for canonical content, editorial publishing, public consumption and player-owned progression.",
    features: [
      "Sprint 8.1: canonical Hero Skills",
      "Structured skill editing and validation",
      "Skill publication through the existing workflow",
      "Published skills consumed by Hero experiences",
      "Hero progression and star-up",
      "Hero gear and exclusive gear",
      "Player Hero collection and progression",
      "Public Hero experience",
      "Domain-wide end-to-end validation",
    ],
  },
  {
    version: "0.7",
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
            The Forge Platform Foundation is complete. Development now moves
            one epic, one sprint and one release at a time, beginning with the
            complete Hero Domain in Release 0.6.0.
          </p>
        </div>

        <div className="product-roadmap__hero-actions">
          <Link className="button button--primary" to="/release-notes">
            Read release notes
          </Link>
          <Link className="button button--secondary" to="/my-forge">
            Open My Forge
          </Link>
        </div>
      </header>

      <section className="roadmap-priority-panel">
        <div>
          <span className="roadmap-priority-panel__icon">⚒️</span>
          <div>
            <p className="eyebrow">Current development priority</p>
            <h2>Release 0.6.0 — Hero Domain Complete</h2>
            <p>
              Sprint 8.1 focuses exclusively on Hero Skills as a complete
              canonical vertical slice, using the existing editorial and
              publishing platform without redesigning the architecture.
            </p>
          </div>
        </div>

        <div className="roadmap-priority-panel__tags">
          <span>Hero Skills</span>
          <span>Canonical content</span>
          <span>Structured editing</span>
          <span>Publishing</span>
          <span>Public consumption</span>
        </div>
      </section>

      <div className="product-roadmap__timeline">
        {roadmapReleases.map((release) => (
          <article
            className={`roadmap-release roadmap-release--${release.status}`}
            key={release.version}
          >
            <div className="roadmap-release__header">
              <div className="roadmap-release__version">
                <span>{release.version === "Foundation" ? "Phase" : "Version"} {release.version}</span>
                <h2>{release.name}</h2>
              </div>

              <div className="roadmap-release__status-wrap">
                {release.priority && (
                  <span className="roadmap-release__priority">
                    {release.priority}
                  </span>
                )}
                <span
                  className={`roadmap-release__status roadmap-release__status--${release.status}`}
                >
                  {getStatusLabel(release.status)}
                </span>
              </div>
            </div>

            <p className="roadmap-release__description">
              {release.description}
            </p>

            <div className="roadmap-release__progress">
              <div className="roadmap-release__progress-heading">
                <span>Release progress</span>
                <strong>{release.progress}%</strong>
              </div>
              <div className="roadmap-release__progress-track">
                <span style={{ width: `${release.progress}%` }} />
              </div>
            </div>

            <div className="roadmap-release__features">
              {release.features.map((feature) => (
                <div key={feature}>
                  <span aria-hidden="true">
                    {release.status === "live" ? "✓" : "→"}
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <section className="roadmap-community-note">
        <div>
          <p className="eyebrow">Community-led development</p>
          <h2>Help shape what comes next</h2>
          <p>
            Priorities can evolve through evidence and community feedback, but
            the active domain will be completed before Forge expands again.
          </p>
        </div>
        <a
          className="button button--secondary"
          href="https://docs.google.com/forms/d/e/1FAIpQLScFO6lIdyTiczPQkSbinR1tGWNXw01opy77VgX1003FF6z86Q/viewform?usp=publish-editor"
          target="_blank"
          rel="noreferrer"
        >
          Send feedback
        </a>
      </section>
    </section>
  );
}

export default RoadmapPage;
