import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  useRole,
  type ForgePermission,
} from '../../context/RoleContext'

type ProtectedRouteProps = {
  children: ReactNode
  permission: ForgePermission
}

function ProtectedRoute({
  children,
  permission,
}: ProtectedRouteProps) {
  const {
    hasPermission,
    loadingRole,
  } = useRole()

  if (loadingRole) {
    return (
      <section className="admin-access-state">
        <span aria-hidden="true">⏳</span>

        <h1>Checking access</h1>

        <p>
          Forge is confirming your platform permissions.
        </p>
      </section>
    )
  }

  if (!hasPermission(permission)) {
    return (
      <section className="admin-access-state admin-access-state--denied">
        <span aria-hidden="true">🔒</span>

        <h1>Access denied</h1>

        <p>
          You do not have permission to access this area of
          Forge Admin.
        </p>

        <Link
          className="button button--primary"
          to="/"
        >
          Return to Forge
        </Link>
      </section>
    )
  }

  return children
}

export default ProtectedRoute