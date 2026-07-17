import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { artTemplates } from '../data/artTemplates'
import { nameVariants } from '../data/nameVariants'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import { APP_VERSION } from '../config/release'

type ForgeTool = {
  title: string
  description: string
  icon: string
  path: string
  action: string
  featured?: boolean
}

const forgeTools: ForgeTool[] = [
  {
    title: 'Name Forge',
    description:
      'Create distinctive, emoji-free Kingshot player names.',
    icon: '👑',
    path: '/name-studio',
    action: 'Forge a name',
    featured: true,
  },
  {
    title: 'Art Forge',
    description:
      'Browse and copy community artwork for Kingshot chat.',
    icon: '🎨',
    path: '/art-studio',
    action: 'Browse artwork',
    featured: true,
  },
  {
    title: 'Chat Forge',
    description:
      'Build announcements, rally calls and alliance messages.',
    icon: '💬',
    path: '/chat-studio',
    action: 'Create a message',
  },
  {
    title: 'Character Library',
    description:
      'Explore scripts, ornaments and characters tested in Kingshot.',
    icon: '📚',
    path: '/characters',
    action: 'Browse characters',
  },
  {
    title: 'Compatibility Lab',
    description:
      'Check whether characters are known to work inside the game.',
    icon: '🧪',
    path: '/compatibility',
    action: 'Open the lab',
  },
  {
    title: 'My Forge',
    description:
      'View your favourite artwork, name styles and saved items.',
    icon: '⭐',
    path: '/my-forge',
    action: 'View My Forge',
  },
  {
    title: 'Gift Codes',
    description:
      'View and copy currently active Kingshot gift codes.',
    icon: '🎁',
    path: '/gift-codes',
    action: 'View active codes',
    featured: true,
  },
  {
    title: 'Player Lookup',
    description:
      'Find a player’s current kingdom, level and profile.',
    icon: '👤',
    path: '/player-lookup',
    action: 'Find a player',
    featured: true,
  },
  {
    title: 'Kingdom Explorer',
    description:
      'Check a kingdom’s opening date, estimated age and status.',
    icon: '🏰',
    path: '/kingdom-explorer',
    action: 'Explore a kingdom',
    featured: true,
  },
  {
    title: 'Kvk Tracker',
    description:
      'Explore prep results, castle winners and kingdom match history.',
    icon: '⚔️',
    path: '/kvk-tracker',
    action: 'Search KvK results',
    featured: true,
  },
  {
    title: 'Kingdom Community',
    description:
      'Find registered players and community information for a Kingshot kingdom.',
    icon: '🌍',
    path: '/kingdom-community',
    action: 'Explore a community',
    featured: true,
  },
  {
    title: 'Alliance Directory',
    description:
      'Browse and join active alliances in Kingshot.',
    icon: '🛡️',
    path: '/alliance-directory',
    action: 'View alliances',
    featured: true,
  },
  {
    title: 'Transfer Hub',
    description:
      'Create your transfer profile and connect with recruiting kingdoms and alliances.',
    icon: '🎫',
    path: '/my-forge/transfer-profile',
    action: 'Create transfer profile',
    featured: true,
  },
]

function HomePage() {
  const { user, loading } = useAuth()

  const {
    playerAccount,
    loadingPlayerAccount,
  } = usePlayerIdentity()

  const displayName =
    playerAccount?.player_name ??
    user?.user_metadata.full_name ??
    user?.user_metadata.name ??
    user?.email?.split('@')[0] ??
    'Forger'

  const testedArtworkCount = artTemplates.filter(
    (template) => template.testedInKingshot,
  ).length

  const communityArtworkCount = artTemplates.filter(
    (template) =>
      template.source === 'Alliance Submission' ||
      template.source === 'Community Submission',
  ).length

  return (
    <section className="forge-hub">
      <header className="forge-hub-hero">
        <div className="forge-hub-hero__content">
          <p className="eyebrow">
            Unofficial Kingshot community toolkit
          </p>

          <h1>
            {user && !loading && !loadingPlayerAccount
              ? `Welcome back, ${displayName}.`
              : 'Forge your Kingshot identity.'}
          </h1>

          <p className="forge-hub-hero__description">
            Create player names, chat messages and copy-ready
            artwork using characters tested inside Kingshot.
          </p>

          {playerAccount && (
            <div className="forge-hub-player-identity">
              {playerAccount.profile_photo && (
                <img
                  src={playerAccount.profile_photo}
                  alt=""
                />
              )}

              <div>
                <strong>{playerAccount.player_name}</strong>

                <span>
                  Kingdom {playerAccount.kingdom_id}
                  {' · '}
                  {playerAccount.level_rendered_detailed ||
                    playerAccount.level_rendered ||
                    (playerAccount.player_level
                      ? `Level ${playerAccount.player_level}`
                      : 'Level unavailable')}
                </span>
              </div>
            </div>
          )}

          <div className="forge-hub-hero__actions">
            <Link
              className="button button--primary"
              to="/name-studio"
            >
              👑 Open Name Forge
            </Link>

            <Link
              className="button button--secondary"
              to="/art-studio"
            >
              🎨 Browse Art Forge
            </Link>
          </div>
        </div>

        <div className="forge-hub-status">
          <span className="forge-hub-status__badge">
            Beta
          </span>

          <strong>Community-powered</strong>

          <p>
            Kingshot Forge is growing through player testing,
            feedback and submitted content.
          </p>

          <Link to="/roadmap">
            View development roadmap →
          </Link>
        </div>
      </header>

      <section className="home-release-banner">
        <div className="home-release-banner__content">
          <div className="home-release-banner__icon">
            🚀
          </div>

          <div>
            <div className="home-release-banner__meta">
              <span>Current deployment</span>
              <strong>Version {APP_VERSION}</strong>
            </div>

            <h2>Domain foundations are complete</h2>

            <p>
              Release 0.7.1 established the governed foundations for Player Identity,
              Gift Redemption, Art Studio, Hero Skills and Verification Centre workflows.
            </p>

            <div className="home-release-banner__tags">
              <span>Player Identity</span>
              <span>Gift Redemption</span>
              <span>Art Studio</span>
              <span>Verification Centre</span>
            </div>
          </div>
        </div>

        <div className="home-release-banner__actions">
          <Link
            className="button button--primary"
            to="/release-notes"
          >
            See what’s new
          </Link>

          <Link
            className="button button--secondary"
            to="/roadmap"
          >
            View roadmap
          </Link>
        </div>
      </section>

      <section className="forge-hub-section">
        <div className="forge-hub-section__heading">
          <div>
            <p className="eyebrow">Tools and resources</p>
            <h2>Explore Kingshot Forge</h2>
          </div>
        </div>

        <div className="forge-tool-grid">
          {forgeTools.map((tool) => (
            <Link
              className={
                tool.featured
                  ? 'forge-tool-card forge-tool-card--featured'
                  : 'forge-tool-card'
              }
              to={tool.path}
              key={tool.title}
            >
              <span
                className="forge-tool-card__icon"
                aria-hidden="true"
              >
                {tool.icon}
              </span>

              <div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </div>

              <span className="forge-tool-card__action">
                {tool.action} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="forge-hub-section">
        <div className="forge-hub-section__heading">
          <div>
            <p className="eyebrow">Forge at a glance</p>
            <h2>Current library</h2>
          </div>
        </div>

        <div className="forge-stat-grid">
          <div className="forge-stat-card">
            <strong>{artTemplates.length}</strong>
            <span>Artwork designs</span>
          </div>

          <div className="forge-stat-card">
            <strong>{communityArtworkCount}</strong>
            <span>Community submissions</span>
          </div>

          <div className="forge-stat-card">
            <strong>{testedArtworkCount}</strong>
            <span>Tested artworks</span>
          </div>

          <div className="forge-stat-card">
            <strong>{nameVariants.length}</strong>
            <span>Name styles</span>
          </div>
        </div>
      </section>

      <section className="forge-hub-community">
        <div>
          <p className="eyebrow">Community platform</p>

          <h2>Help build the Forge</h2>

          <p>
            Sign in to access your Forge profile and connected player identity.
            Community features will activate only after their safety and publishing checks pass.
          </p>
        </div>

        <div className="forge-hub-community__actions">
          {user ? (
            <Link
              className="button button--primary"
              to="/my-forge"
            >
              Open My Forge
            </Link>
          ) : (
            <span className="forge-hub-community__note">
              Sign in from the menu to prepare your Forge profile.
            </span>
          )}

          <Link
            className="button button--secondary"
            to="/roadmap"
          >
            See what is coming
          </Link>
        </div>
      </section>

      <section className="forge-hub-support">
        <div>
          <span aria-hidden="true">☕</span>

          <div>
            <strong>Support Kingshot Forge</strong>

            <p>
              Support helps fund testing, hosting and new community
              features.
            </p>
          </div>
        </div>

        <a
          className="button button--coffee"
          href="https://buymeacoffee.com/jrcs1981"
          target="_blank"
          rel="noreferrer"
        >
          Buy me a coffee
        </a>
      </section>
    </section>
  )
}

export default HomePage
