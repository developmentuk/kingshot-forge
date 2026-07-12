type RoadmapStatus = 'Live' | 'In development' | 'Planned' | 'Future'

type RoadmapItem = {
  title: string
  description: string
  status: RoadmapStatus
  features: string[]
}

const roadmapItems: RoadmapItem[] = [
  {
    title: 'Name Forge',
    description:
      'Create distinctive Kingshot-compatible usernames using tested scripts and decorations.',
    status: 'Live',
    features: [
      'Fantasy, Runic, Elegant and Cute styles',
      'Decorative wrappers',
      'Character counter',
      'Copy to clipboard',
    ],
  },
  {
    title: 'Chat Forge',
    description:
      'Build announcements, rally alerts and event messages ready to paste into Kingshot.',
    status: 'Live',
    features: [
      'Event templates',
      'Live preview',
      'Emoji picker',
      '500-character warning',
    ],
  },
  {
    title: 'Character Library',
    description:
      'Browse the scripts, symbols and drawing characters tested inside Kingshot.',
    status: 'Live',
    features: [
      'Hundreds of characters',
      'Search and category filters',
      'Copy individual characters',
      'Copy complete character groups',
    ],
  },
  {
    title: 'Name Forge v2',
    description:
      'Generate multiple versions of a name at once instead of producing only one result.',
    status: 'In development',
    features: [
      'Three or more variations per style',
      'Royal, Dark, Viking and Warrior styles',
      'Readability controls',
      'Random name generation',
    ],
  },
  {
    title: 'Art Forge',
    description:
      'Browse copy-ready Kingshot artwork created from compatible text, emoji and Unicode.',
    status: 'Planned',
    features: [
      'Cats and animals',
      'Castles and dragons',
      'Battle scenes',
      'Funny chat artwork',
    ],
  },
  {
    title: 'Flag Forge',
    description:
      'Generate static and waving emoji flags designed for Kingshot chat.',
    status: 'Planned',
    features: [
      'Country picker',
      'Static and waving styles',
      'Different sizes',
      'Cat and mascot variations',
    ],
  },
  {
    title: 'Compatibility Lab',
    description:
      'Search our testing records to see whether a character works in Kingshot.',
    status: 'Planned',
    features: [
      'Chat-tested status',
      'Player-name testing',
      'Supported and unsupported sets',
      'Community test submissions',
    ],
  },
  {
    title: 'Community Forge',
    description:
      'Allow players to submit and share names, templates and chat art.',
    status: 'Future',
    features: [
      'Community submissions',
      'Moderated content',
      'Favourites',
      'Popular creations',
    ],
  },
  {
    title: 'AI Forge',
    description:
      'Describe what you need and generate a compatible name, banner or artwork design.',
    status: 'Future',
    features: [
      'Natural-language requests',
      'Name suggestions',
      'Custom banners',
      'Kingshot-compatible artwork',
    ],
  },
]

function RoadmapPage() {
  return (
    <section className="section page-section">
      <div className="section-heading">
        <p className="eyebrow">Development Roadmap</p>

        <h1 className="page-title">What we are forging next</h1>

        <p>
          Kingshot Forge will continue growing with new name styles,
          chat templates, artwork and community-tested characters.
        </p>
      </div>

      <div className="roadmap-summary">
        <div>
          <strong>
            {
              roadmapItems.filter((item) => item.status === 'Live')
                .length
            }
          </strong>
          <span>Live tools</span>
        </div>

        <div>
          <strong>
            {
              roadmapItems.filter(
                (item) => item.status === 'In development',
              ).length
            }
          </strong>
          <span>In development</span>
        </div>

        <div>
          <strong>
            {
              roadmapItems.filter(
                (item) => item.status === 'Planned',
              ).length
            }
          </strong>
          <span>Planned tools</span>
        </div>

        <div>
          <strong>
            {
              roadmapItems.filter(
                (item) => item.status === 'Future',
              ).length
            }
          </strong>
          <span>Future ideas</span>
        </div>
      </div>

      <div className="roadmap-grid">
        {roadmapItems.map((item) => (
          <article className="roadmap-card" key={item.title}>
            <div className="roadmap-card__top">
              <h2>{item.title}</h2>

              <span
                className={`roadmap-status roadmap-status--${item.status
                  .toLowerCase()
                  .replaceAll(' ', '-')}`}
              >
                {item.status}
              </span>
            </div>

            <p>{item.description}</p>

            <ul>
              {item.features.map((feature) => (
                <li key={feature}>
                  <span>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="roadmap-support">
        <div>
          <p className="eyebrow">Support Development</p>

          <h2>Help us keep forging</h2>

          <p>
            Support helps fund further Kingshot testing, new templates
            and future tools.
          </p>
        </div>

        <a
          className="button button--coffee"
          href="https://buymeacoffee.com/jrcs1981"
          target="_blank"
          rel="noreferrer"
        >
          ☕ Buy Me a Coffee
        </a>
      </div>
    </section>
  )
}

export default RoadmapPage