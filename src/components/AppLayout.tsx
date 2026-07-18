import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import AccountMenu from './AccountMenu'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import FeedbackDialog from './FeedbackDialog'
import { useRole } from '../context/RoleContext'
import { getWorkspace, workspaceForPath, type WorkspaceNavItem } from '../navigation/workspaceRegistry'
import { RELEASE_DISPLAY, SHORT_COMMIT_SHA } from '../config/release'

function NavigationLink({ item, onNavigate }: { item: WorkspaceNavItem; onNavigate?: () => void }) {
  const content = <><span className="app-navigation__icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>{item.status && <small className="navigation-status">{item.status}</small>}</>
  if (item.status === 'planned' || item.status === 'unavailable') return <div className="app-navigation__link app-navigation__link--disabled" aria-disabled="true">{content}</div>
  return <NavLink to={item.path} end={item.path === '/' || item.path === '/operations'} className={({ isActive }) => isActive ? 'app-navigation__link app-navigation__link--active' : 'app-navigation__link'} onClick={onNavigate}>{content}</NavLink>
}

function NavigationGroup({ title, items, onNavigate }: { title: string; items: ReadonlyArray<WorkspaceNavItem>; onNavigate?: () => void }) {
  return <section className="app-navigation__group"><p className="app-navigation__group-title">{title}</p><div className="app-navigation__group-links">{items.map((item) => <NavigationLink item={item} key={item.path} onNavigate={onNavigate} />)}</div></section>
}

function AppLayout() {
  // Community Art remains in the Moderation workspace; the registry owns its route.
  // The registry permission is equivalent to hasPermission('moderation.manage').
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { hasPermission, loadingRole } = useRole()
  const location = useLocation()
  const workspace = getWorkspace(workspaceForPath(location.pathname))
  const visibleGroups = workspace.groups.map((group) => ({ ...group, items: group.items.filter((item) => !item.permission || hasPermission(item.permission)) })).filter((group) => group.items.length > 0)

  useEffect(() => { setNavigationOpen(false) }, [location.pathname])
  useEffect(() => { document.body.style.overflow = navigationOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [navigationOpen])
  useEffect(() => { const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setNavigationOpen(false) }; window.addEventListener('keydown', handleEscape); return () => window.removeEventListener('keydown', handleEscape) }, [])

  function closeNavigation() { setNavigationOpen(false) }

  return <div className="app-shell">
    <header className="app-header"><div className="app-header__inner">
      <button type="button" className="app-header__menu-button" aria-label="Open navigation" aria-expanded={navigationOpen} aria-controls="primary-navigation" onClick={() => setNavigationOpen((current) => !current)}><span /><span /><span /></button>
      <Link to="/" className="app-brand" onClick={closeNavigation}><span className="app-brand__mark" aria-hidden="true">⚒️</span><span className="app-brand__text"><strong>Kingshot Forge</strong><small>{workspace.label}</small></span></Link>
      <div className="app-header__workspace"><WorkspaceSwitcher /></div><div className="app-header__account"><AccountMenu /></div>
    </div></header>
    <div className="app-shell__body">
      <aside id="primary-navigation" className={navigationOpen ? 'app-sidebar app-sidebar--open' : 'app-sidebar'}>
        <div className="app-sidebar__mobile-header"><Link to="/" className="app-brand" onClick={closeNavigation}><span className="app-brand__mark" aria-hidden="true">⚒️</span><span className="app-brand__text"><strong>Kingshot Forge</strong><small>{workspace.label}</small></span></Link><button type="button" className="app-sidebar__close" aria-label="Close navigation" onClick={closeNavigation}>×</button></div>
        <nav className="app-navigation" aria-label={`${workspace.label} navigation`}><div className="app-navigation__workspace-label"><span>Current workspace</span><strong>{workspace.label}</strong></div>{!loadingRole && visibleGroups.map((group) => <NavigationGroup key={group.title} title={group.title} items={group.items} onNavigate={closeNavigation} />)}</nav>
        <div className="app-sidebar__footer"><button type="button" className="app-sidebar__feedback" onClick={() => { closeNavigation(); setFeedbackOpen(true) }}><span aria-hidden="true">💡</span>Send feedback</button><Link className="app-version-link" to="/release-notes" onClick={closeNavigation} title={`Commit ${SHORT_COMMIT_SHA}`}>{RELEASE_DISPLAY}</Link></div>
      </aside>
      {navigationOpen && <button type="button" className="app-sidebar-backdrop" aria-label="Close navigation" onClick={closeNavigation} />}
      <main className="app-main"><Outlet /></main>
    </div>
    <footer className="app-footer"><div className="app-footer__inner"><div><strong>Kingshot Forge</strong><p>An unofficial community companion for Kingshot players.</p></div><div className="app-footer__links"><Link to="/join">Join Forge</Link><Link to="/roadmap">Roadmap</Link><Link to="/release-notes">Release Notes</Link><button type="button" onClick={() => setFeedbackOpen(true)}>Feedback</button><Link className="app-version-link" to="/release-notes" title={`Commit ${SHORT_COMMIT_SHA}`}>{RELEASE_DISPLAY}</Link></div></div></footer>
    <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} defaultType="suggestion" />
  </div>
}

export default AppLayout
