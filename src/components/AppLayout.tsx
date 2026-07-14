import { useEffect, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom'
import AccountMenu from './AccountMenu'

type NavigationItem = {
  label: string
  shortLabel: string
  icon: string
  path: string
}

const forgeNavigation: NavigationItem[] = [
  {
    label: 'Name Studio',
    shortLabel: 'Names',
    icon: '✨',
    path: '/name-studio',
  },
  {
    label: 'Art Studio',
    shortLabel: 'Art',
    icon: '🎨',
    path: '/art-studio',
  },
  {
    label: 'Chat Studio',
    shortLabel: 'Chat',
    icon: '💬',
    path: '/chat-studio',
  },
]

const companionNavigation: NavigationItem[] = [
  {
    label: 'Player Lookup',
    shortLabel: 'Players',
    icon: '👤',
    path: '/player-lookup',
  },
  {
    label: 'Gift Codes',
    shortLabel: 'Codes',
    icon: '🎁',
    path: '/gift-codes',
  },
  {
    label: 'Kingdom Explorer',
    shortLabel: 'Kingdoms',
    icon: '🏰',
    path: '/kingdom-explorer',
  },
  {
    label: 'Kingdom Community',
    shortLabel: 'Community',
    icon: '🌍',
    path: '/kingdom-community',
  },
  {
    label: 'Alliance Directory',
    shortLabel: 'Alliances',
    icon: '🛡️',
    path: '/alliance-directory',
  },
  {
    label: 'KvK Tracker',
    shortLabel: 'KvK',
    icon: '⚔️',
    path: '/kvk-tracker',
  },
  {
    label: 'Transfer Hub',
    shortLabel: 'Hub',
    icon: '🌐',
    path: '/transfer-hub',
  },
]

const myForgeNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    icon: '⭐',
    path: '/my-forge',
  },
  {
    label: 'My Profile',
    shortLabel: 'Profile',
    icon: '🪪',
    path: '/my-forge/profile',
  },
  {
    label: 'Hero Collection',
    shortLabel: 'Heroes',
    icon: '🦸',
    path: '/my-forge/hero-collection',
  },
  {
    label: 'Hero Showcase',
    shortLabel: 'Showcase',
    icon: '🏆',
    path: '/my-forge/heroes',
  },
  {
    label: 'Transfer Profile',
    shortLabel: 'Transfer',
    icon: '🎫',
    path: '/transfer-profile',
  },
]

const libraryNavigation: NavigationItem[] = [
  {
    label: 'Character Library',
    shortLabel: 'Characters',
    icon: '🔤',
    path: '/characters',
  },
  {
    label: 'Compatibility',
    shortLabel: 'Compatibility',
    icon: '✅',
    path: '/compatibility',
  },
  {
    label: 'Codex',
    shortLabel: 'Codex',
    icon: '📚',
    path: '/codex',
  },
]

const platformNavigation: NavigationItem[] = [
  {
    label: 'Roadmap',
    shortLabel: 'Roadmap',
    icon: '🗺️',
    path: '/roadmap',
  },
  {
    label: 'Release Notes',
    shortLabel: 'Updates',
    icon: '🚀',
    path: '/release-notes',
  },
]

const mobileNavigation: NavigationItem[] = [
  {
    label: 'Home',
    shortLabel: 'Home',
    icon: '🏠',
    path: '/',
  },
  {
    label: 'Player Lookup',
    shortLabel: 'Players',
    icon: '👤',
    path: '/player-lookup',
  },
  {
    label: 'KvK Tracker',
    shortLabel: 'KvK',
    icon: '⚔️',
    path: '/kvk-tracker',
  },
  {
    label: 'Gift Codes',
    shortLabel: 'Codes',
    icon: '🎁',
    path: '/gift-codes',
  },
  {
    label: 'My Forge',
    shortLabel: 'My Forge',
    icon: '⭐',
    path: '/my-forge',
  },
]

const feedbackUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLScFO6lIdyTiczPQkSbinR1tGWNXw01opy77VgX1003FF6z86Q/viewform?usp=publish-editor'

function NavigationLink({
  item,
  onNavigate,
}: {
  item: NavigationItem
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        isActive
          ? 'app-navigation__link app-navigation__link--active'
          : 'app-navigation__link'
      }
      onClick={onNavigate}
    >
      <span
        className="app-navigation__icon"
        aria-hidden="true"
      >
        {item.icon}
      </span>

      <span>{item.label}</span>
    </NavLink>
  )
}

function NavigationGroup({
  title,
  items,
  onNavigate,
}: {
  title: string
  items: NavigationItem[]
  onNavigate?: () => void
}) {
  return (
    <section className="app-navigation__group">
      <p className="app-navigation__group-title">
        {title}
      </p>

      <div className="app-navigation__group-links">
        {items.map((item) => (
          <NavigationLink
            key={item.path}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  )
}

function MobileBottomLink({
  item,
}: {
  item: NavigationItem
}) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        isActive
          ? 'mobile-bottom-navigation__link mobile-bottom-navigation__link--active'
          : 'mobile-bottom-navigation__link'
      }
    >
      <span aria-hidden="true">{item.icon}</span>
      <small>{item.shortLabel}</small>
    </NavLink>
  )
}

function AppLayout() {
  const [navigationOpen, setNavigationOpen] =
    useState(false)

  const location = useLocation()

  useEffect(() => {
    setNavigationOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!navigationOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [navigationOpen])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNavigationOpen(false)
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

  function closeNavigation() {
    setNavigationOpen(false)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <button
            type="button"
            className="app-header__menu-button"
            aria-label="Open navigation"
            aria-expanded={navigationOpen}
            aria-controls="primary-navigation"
            onClick={() =>
              setNavigationOpen((current) => !current)
            }
          >
            <span />
            <span />
            <span />
          </button>

          <Link
            to="/"
            className="app-brand"
            onClick={closeNavigation}
          >
            <span
              className="app-brand__mark"
              aria-hidden="true"
            >
              ⚒️
            </span>

            <span className="app-brand__text">
              <strong>Kingshot Forge</strong>
              <small>Community Companion</small>
            </span>
          </Link>

          <div className="app-header__account">
            <AccountMenu />
          </div>
        </div>
      </header>

      <div className="app-shell__body">
        <aside
          id="primary-navigation"
          className={
            navigationOpen
              ? 'app-sidebar app-sidebar--open'
              : 'app-sidebar'
          }
        >
          <div className="app-sidebar__mobile-header">
            <Link
              to="/"
              className="app-brand"
              onClick={closeNavigation}
            >
              <span
                className="app-brand__mark"
                aria-hidden="true"
              >
                ⚒️
              </span>

              <span className="app-brand__text">
                <strong>Kingshot Forge</strong>
                <small>Community Beta</small>
              </span>
            </Link>

            <button
              type="button"
              className="app-sidebar__close"
              aria-label="Close navigation"
              onClick={closeNavigation}
            >
              ×
            </button>
          </div>

          <nav
            className="app-navigation"
            aria-label="Primary navigation"
          >
            <NavigationGroup
              title="Forge tools"
              items={forgeNavigation}
              onNavigate={closeNavigation}
            />

            <NavigationGroup
              title="My Forge"
              items={myForgeNavigation}
              onNavigate={closeNavigation}
            />

            <NavigationGroup
              title="Kingshot companion"
              items={companionNavigation}
              onNavigate={closeNavigation}
            />

            <NavigationGroup
              title="Library"
              items={libraryNavigation}
              onNavigate={closeNavigation}
            />

            <NavigationGroup
              title="Community and updates"
              items={platformNavigation}
              onNavigate={closeNavigation}
            />
          </nav>

          <div className="app-sidebar__footer">
            <a
              className="app-sidebar__feedback"
              href={feedbackUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true">💡</span>
              Send feedback
            </a>

            <Link
              className="app-version-link"
              to="/release-notes"
              onClick={closeNavigation}
            >
              Community Beta · v0.4.0
            </Link>
          </div>
        </aside>

        {navigationOpen && (
          <button
            type="button"
            className="app-sidebar-backdrop"
            aria-label="Close navigation"
            onClick={closeNavigation}
          />
        )}

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <div>
            <strong>Kingshot Forge</strong>

            <p>
              An unofficial community companion for
              Kingshot players.
            </p>
          </div>

          <div className="app-footer__links">
            <Link to="/roadmap">Roadmap</Link>

            <Link to="/release-notes">
              Release Notes
            </Link>

            <a
              href={feedbackUrl}
              target="_blank"
              rel="noreferrer"
            >
              Feedback
            </a>

            <Link
              className="app-version-link"
              to="/release-notes"
            >
              Community Beta · v0.4.0
            </Link>
          </div>
        </div>
      </footer>

      <nav
        className="mobile-bottom-navigation"
        aria-label="Mobile navigation"
      >
        {mobileNavigation.map((item) => (
          <MobileBottomLink
            key={item.path}
            item={item}
          />
        ))}
      </nav>

      <a
        className="floating-feedback-button"
        href={feedbackUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Send Kingshot Forge feedback"
      >
        💡
      </a>
    </div>
  )
}

export default AppLayout