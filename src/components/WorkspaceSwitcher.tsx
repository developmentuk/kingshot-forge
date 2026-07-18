import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { accessibleWorkspaces, getWorkspace, type ForgeWorkspaceId, workspaceForPath } from '../navigation/workspaceRegistry'

const preferenceKey = 'kingshot-forge:last-workspace'

export default function WorkspaceSwitcher() {
  const { user } = useAuth()
  const { role, hasPermission } = useRole()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const access = useMemo(() => ({ user: Boolean(user), role, hasPermission }), [user, role, hasPermission])
  const available = accessibleWorkspaces(access)
  const currentId = workspaceForPath(location.pathname)
  const current = getWorkspace(currentId)

  useEffect(() => {
    const stored = window.localStorage.getItem(preferenceKey) as ForgeWorkspaceId | null
    if (!stored || !available.some((workspace) => workspace.id === stored)) return
    if (currentId === 'player' && stored !== 'player' && location.pathname === '/') navigate(getWorkspace(stored).homePath, { replace: true })
  }, [available, currentId, location.pathname, navigate])

  function chooseWorkspace(id: ForgeWorkspaceId) {
    if (!available.some((workspace) => workspace.id === id)) return
    window.localStorage.setItem(preferenceKey, id)
    setOpen(false)
    navigate(getWorkspace(id).homePath)
  }

  return (
    <div className="workspace-switcher">
      <button type="button" className="workspace-switcher__button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        <span className="workspace-switcher__label">Workspace</span>
        <strong>{current.label}</strong>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="workspace-switcher__menu" role="menu" aria-label="Forge workspaces">
          {available.map((workspace) => (
            <button key={workspace.id} type="button" role="menuitem" className={workspace.id === currentId ? 'workspace-switcher__item workspace-switcher__item--active' : 'workspace-switcher__item'} onClick={() => chooseWorkspace(workspace.id)}>
              <strong>{workspace.label}</strong>
              <span>{workspace.description}</span>
            </button>
          ))}
          {currentId !== 'player' && <Link className="workspace-switcher__return" to="/" onClick={() => { window.localStorage.setItem(preferenceKey, 'player'); setOpen(false) }}>Return to Player View</Link>}
        </div>
      )}
    </div>
  )
}
