import { useEffect, useState } from 'react'
import {
  NavLink,
  Outlet,
  useLocation,
} from 'react-router'
import AccountMenu from './AccountMenu'


const feedbackFormUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLScFO6lIdyTiczPQkSbinR1tGWNXw01opy77VgX1003FF6z86Q/viewform?usp=publish-editor'

type NavigationItem = {
  label: string
  shortLabel?: string
  icon: string
  path: string
  end?: boolean
}

const forgeNavigation: NavigationItem[] = [
  {
    label: 'Name Forge',
    shortLabel: 'Names',
    icon: '👑',
    path: '/name-studio',
  },
  {
    label: 'Chat Forge',
    shortLabel: 'Chat',
    icon: '💬',
    path: '/chat-studio',
  },
  {
    label: 'Art Forge',
    shortLabel: 'Art',
    icon: '🎨',
    path: '/art-studio',
  },
]

const libraryNavigation: NavigationItem[] = [
  {
    label: 'Character Library',
    shortLabel: 'Library',
    icon: '📚',
    path: '/characters',
  },
  {
    label: 'Compatibility Lab',
    icon: '🧪',
    path: '/compatibility',
  },
  {
    label: 'Forge Codex',
    icon: '📖',
    path: '/codex',
  },
  {
  label: 'Gift Codes',
  shortLabel: 'Codes',
  icon: '🎁',
  path: '/gift-codes',
},
{
  label: 'Player Lookup',
  shortLabel: 'Players',
  icon: '👤',
  path: '/player-lookup',
},
{
  label: 'Kingdom Explorer',
  shortLabel: 'Kingdoms',
  icon: '🏰',
  path: '/kingdom-explorer',
},
{
  label: 'Kvk Tracker',
  shortLabel: 'Kvk',
  icon: '⚔️',
  path: '/kvk-tracker',
}
]

const communityNavigation: NavigationItem[] = [
  {
    label: 'My Forge',
    shortLabel: 'My Forge',
    icon: '⭐',
    path: '/my-forge',
  },
  {
    label: 'Roadmap',
    icon: '🗺️',
    path: '/roadmap',
  },
]

function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle(
      'mobile-menu-is-open',
      menuOpen,
    )

    return () => {
      document.body.classList.remove(
        'mobile-menu-is-open',
      )
    }
  }, [menuOpen])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [])

  return (
    <div className="app-shell">
      <header className="site-header">
        <nav
          className="navigation"
          aria-label="Main navigation"
        >
          <NavLink className="brand" to="/">
            <span
              className="brand__icon"
              aria-hidden="true"
            >
              ⚒️
            </span>

            <span className="brand__text">
              <strong>Kingshot</strong>
              <small>Forge</small>
            </span>
          </NavLink>

          <div className="navigation__links">
            <NavLink to="/" end>
              Home
            </NavLink>

            <NavLink to="/name-studio">
              Names
            </NavLink>

            <NavLink to="/chat-studio">
              Chat
            </NavLink>

            <NavLink to="/art-studio">
              Art
            </NavLink>

            <NavLink to="/characters">
              Characters
            </NavLink>

            <NavLink to="/my-forge">
              My Forge
            </NavLink>

            <NavLink to="/roadmap">
              Roadmap
            </NavLink>
          </div>

          <div className="navigation__actions">
            <div className="navigation__account">
              <AccountMenu />
            </div>

            <a
              className="button button--coffee navigation__support"
              href="https://buymeacoffee.com/jrcs1981"
              target="_blank"
              rel="noreferrer"
            >
              ☕ Support
            </a>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={
              menuOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            onClick={() =>
              setMenuOpen((current) => !current)
            }
          >
            <span aria-hidden="true">
              {menuOpen ? '×' : '☰'}
            </span>
          </button>
        </nav>
      </header>

      <div
        className={
          menuOpen
            ? 'mobile-navigation-backdrop mobile-navigation-backdrop--open'
            : 'mobile-navigation-backdrop'
        }
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-navigation"
        className={
          menuOpen
            ? 'mobile-navigation mobile-navigation--open'
            : 'mobile-navigation'
        }
        aria-hidden={!menuOpen}
      >
        <div className="mobile-navigation__header">
          <div>
            <span className="eyebrow">
              Kingshot Forge
            </span>

            <strong>Community toolkit</strong>
          </div>

          <button
            type="button"
            className="mobile-navigation__close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        <div className="mobile-navigation__account">
          <AccountMenu />
        </div>

        <nav
          className="mobile-navigation__content"
          aria-label="Mobile navigation"
        >
          <MobileNavigationLink
            item={{
              label: 'Home',
              icon: '🏠',
              path: '/',
              end: true,
            }}
          />

          <MobileNavigationGroup
            title="Forge"
            items={forgeNavigation}
          />

          <MobileNavigationGroup
            title="Library"
            items={libraryNavigation}
          />

          <MobileNavigationGroup
            title="Community"
            items={communityNavigation}
          />
        </nav>

        <div className="mobile-navigation__footer">
          <a
            className="button button--coffee"
            href="https://buymeacoffee.com/jrcs1981"
            target="_blank"
            rel="noreferrer"
          >
            ☕ Support Kingshot Forge
          </a>

          <a
            className="button button--secondary"
            href={feedbackFormUrl}
            target="_blank"
            rel="noreferrer"
          >
            💬 Beta Feedback
          </a>
        </div>
      </aside>

      <main className="page-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div>
          <strong>Kingshot Forge</strong>
          <p>Community-made and unofficial.</p>
        </div>

        <div className="footer__links">
          <NavLink to="/my-forge">
            My Forge
          </NavLink>

          <NavLink to="/roadmap">
            Roadmap
          </NavLink>

          <NavLink to="/codex">
            Codex
          </NavLink>

          <NavLink to="/compatibility">
            Compatibility
          </NavLink>

          <a
            href={feedbackFormUrl}
            target="_blank"
            rel="noreferrer"
          >
            Beta Feedback
          </a>

          <a
            className="footer__support"
            href="https://buymeacoffee.com/jrcs1981"
            target="_blank"
            rel="noreferrer"
          >
            Support the project
          </a>
        </div>
      </footer>

      <nav
        className="mobile-bottom-navigation"
        aria-label="Quick navigation"
      >
        <MobileBottomLink
          item={{
            label: 'Home',
            icon: '🏠',
            path: '/',
            end: true,
          }}
        />

        <MobileBottomLink
          item={forgeNavigation[0]}
        />

        <MobileBottomLink
          item={forgeNavigation[2]}
        />

       <MobileBottomLink
  item={{
    label: 'Gift Codes',
    shortLabel: 'Codes',
    icon: '🎁',
    path: '/gift-codes',
  }}
/>

        <MobileBottomLink
          item={communityNavigation[0]}
        />
      </nav>

      <a
        className="feedback-button"
        href={feedbackFormUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Give beta feedback"
      >
        <span className="feedback-button__icon">
          💬
        </span>

        <span className="feedback-button__text">
          <strong>Beta Feedback</strong>
          <small>
            Report an issue or suggest a feature
          </small>
        </span>
      </a>
    </div>
  )
}

type MobileNavigationGroupProps = {
  title: string
  items: NavigationItem[]
}

function MobileNavigationGroup({
  title,
  items,
}: MobileNavigationGroupProps) {
  return (
    <section className="mobile-navigation__group">
      <h2>{title}</h2>

      <div className="mobile-navigation__links">
        {items.map((item) => (
          <MobileNavigationLink
            key={item.path}
            item={item}
          />
        ))}
      </div>
    </section>
  )
}

type NavigationLinkProps = {
  item: NavigationItem
}

function MobileNavigationLink({
  item,
}: NavigationLinkProps) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) =>
        isActive
          ? 'mobile-navigation__link mobile-navigation__link--active'
          : 'mobile-navigation__link'
      }
    >
      <span
        className="mobile-navigation__link-icon"
        aria-hidden="true"
      >
        {item.icon}
      </span>

      <span>{item.label}</span>

      <span
        className="mobile-navigation__link-arrow"
        aria-hidden="true"
      >
        →
      </span>
    </NavLink>
  )
}

function MobileBottomLink({
  item,
}: NavigationLinkProps) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) =>
        isActive
          ? 'mobile-bottom-navigation__link mobile-bottom-navigation__link--active'
          : 'mobile-bottom-navigation__link'
      }
    >
      <span aria-hidden="true">{item.icon}</span>

      <small>
        {item.shortLabel ?? item.label}
      </small>
    </NavLink>
  )
}

export default AppLayout