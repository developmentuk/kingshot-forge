import { Link } from "react-router-dom";

type RoadmapStatus =
  | "live"
  | "development"
  | "planned"
  | "future";

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
    version: "0.4",
    name: "The Forge",
    status: "live",
    progress: 100,
    description:
      "The foundation release that transformed Kingshot Forge into a live community companion platform.",
    features: [
      "Google sign-in and Forge profiles",
      "Linked Kingshot player identity",
      "Kingshot avatar and player details",
      "Player Lookup",
      "Active Gift Codes",
      "Kingdom Explorer",
      "KvK match history",
      "Supabase backend",
      "Improved mobile experience",
      "Community artwork foundation",
    ],
  },
  {
    version: "0.5",
    name: "Forge Admin",
    status: "live",
    progress: 100,
    priority: "Latest release",
    description:
      "The first live release of Forge Admin, introducing the Kingshot Data Engine, reusable dataset browsers and the foundation of a complete content management system.",
    features: [
      "Forge Admin dashboard",
      "Live Data Engine",
      "Reusable dataset browser",
      "Live Heroes dataset",
      "Live recurring Events dataset",
      "Search, sorting and pagination",
      "Record detail viewer",
      "Dataset adapter framework",
      "Dataset API endpoint",
      "Source provenance and confidence metadata",
      "Tier badges and tooltips",
      "Importer and validation foundations",
    ],
  },
  {
    version: "0.6",
    name: "Forge Admin CMS",
    status: "development",
    progress: 10,
    priority: "Current development sprint",
    description:
      "Forge Admin evolves from a dataset browser into a full content management system with editing, imports, history, comparison and expanded live datasets.",
    features: [
      "Record editing",
      "Structured edit forms",
      "Import Manager",
      "Dataset validation reports",
      "Version history and rollback",
      "Visual change comparison",
      "Global dataset search",
      "Live dataset health dashboard",
      "Buildings dataset",
      "Governor Gear dataset",
      "Troops dataset",
      "Truegold dataset",
      "VIP dataset",
      "War Academy dataset",
      "Publishing workflow",
    ],
  },
  {
    version: "0.7",
    name: "KvK Command Centre",
    status: "planned",
    progress: 0,
    priority: "Top priority",
    description:
      "A complete KvK planning and live coordination suite for players, alliances and kingdoms.",
    features: [
      "KvK preparation calculator",
      "Five-day preparation planner",
      "Personal score projections",
      "Alliance and kingdom scoreboards",
      "Live score updates",
      "Resource and item planning",
      "KvK saving checklist",
      "Battle-day information",
      "Push reminders and event notifications",
      "Historical KvK results",
    ],
  },
  {
    version: "0.8",
    name: "Transfer Hub",
    status: "planned",
    progress: 0,
    priority: "Top priority",
    description:
      "A dedicated system for managing player recruitment, state transfers, alliance vacancies and invitation passes.",
    features: [
      "Kingdom transfer profiles",
      "Player transfer applications",
      "Alliance recruitment listings",
      "Kingdom recruitment pages",
      "Transfer eligibility tracking",
      "Ordinary and special invitation management",
      "Pass allocation and waiting lists",
      "Officer notes and application status",
      "Verified alliance and kingdom representatives",
      "Discord server and channel links",
      "Transfer history and membership changes",
    ],
  },
  {
    version: "0.9",
    name: "Alliance and Kingdom Communities",
    status: "planned",
    progress: 0,
    description:
      "Connected community spaces built around verified players, alliances and kingdoms.",
    features: [
      "Kingdom member directories",
      "Alliance member directories",
      "Favourite players, alliances and kingdoms",
      "Alliance leadership roles",
      "Kingdom administration roles",
      "Alliance pages and branding",
      "Kingdom pages and recruitment information",
      "Discord integration",
      "Shared alliance art and chat templates",
      "Community announcements",
    ],
  },
  {
    version: "1.0",
    name: "The Ultimate Kingshot Companion",
    status: "future",
    progress: 0,
    description:
      "A unified Kingshot community platform bringing together players, alliances, kingdoms, live data, calculators and planning tools.",
    features: [
      "Personalised player dashboard",
      "Verified player communities",
      "KvK Command Centre",
      "Transfer Hub",
      "Alliance and kingdom workspaces",
      "Live events and scoreboards",
      "Community submissions",
      "Progression planners",
      "Push notifications",
      "Installable mobile web app",
    ],
  },
];

function getStatusLabel(status: RoadmapStatus) {
  switch (status) {
    case "live":
      return "Live now";

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

          <h1 className="page-title">
            Building the ultimate Kingshot companion
          </h1>

          <p>
            Kingshot Forge is growing into a connected
            community platform powered by live game data,
            planning tools and a full administrative content
            system.
          </p>
        </div>

        <div className="product-roadmap__hero-actions">
          <Link
            className="button button--primary"
            to="/release-notes"
          >
            Read release notes
          </Link>

          <Link
            className="button button--secondary"
            to="/my-forge"
          >
            Open My Forge
          </Link>
        </div>
      </header>

      <section className="roadmap-priority-panel">
        <div>
          <span className="roadmap-priority-panel__icon">
            ⚙️
          </span>

          <div>
            <p className="eyebrow">
              Current development priority
            </p>

            <h2>Forge Admin CMS</h2>

            <p>
              The current focus is expanding Forge Admin into
              a complete content management system with record
              editing, dataset imports, version history,
              validation and additional live Kingshot datasets.
            </p>
          </div>
        </div>

        <div className="roadmap-priority-panel__tags">
          <span>Record editing</span>
          <span>Import Manager</span>
          <span>Version history</span>
          <span>Global search</span>
          <span>Dataset expansion</span>
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
                <span>Version {release.version}</span>
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
                <span
                  style={{
                    width: `${release.progress}%`,
                  }}
                />
              </div>
            </div>

            <div className="roadmap-release__features">
              {release.features.map((feature) => (
                <div key={feature}>
                  <span aria-hidden="true">
                    {release.status === "live"
                      ? "✓"
                      : "→"}
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
          <p className="eyebrow">
            Community-led development
          </p>

          <h2>Help shape what comes next</h2>

          <p>
            The roadmap will continue to evolve through
            player feedback, testing and community
            priorities.
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