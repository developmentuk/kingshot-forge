import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { accessibleWorkspaces, type ForgeWorkspaceId } from '../navigation/workspaceRegistry'

export default function WorkspaceRoute({ workspaceId, children }: { workspaceId: ForgeWorkspaceId; children: ReactNode }) {
  const { user } = useAuth()
  const { role, hasPermission, loadingRole } = useRole()
  if (loadingRole) return <section className="admin-access-state"><span aria-hidden="true">⏳</span><h1>Checking workspace access</h1><p>Forge is confirming your permissions.</p></section>
  if (!accessibleWorkspaces({ user: Boolean(user), role, hasPermission }).some((workspace) => workspace.id === workspaceId)) return <section className="admin-access-state admin-access-state--denied"><span aria-hidden="true">🔒</span><h1>Workspace unavailable</h1><p>This workspace is not available for your account.</p><Link className="button button--primary" to="/">Return to Player View</Link></section>
  return children
}
