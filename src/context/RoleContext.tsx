import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

export type ForgePlatformRole =
  | 'owner'
  | 'admin'
  | 'moderator'
  | 'content_creator'
  | 'beta_tester'
  | 'contributor'
  | 'viewer'

export type ForgePermission =
  | 'users.read'
  | 'users.read_sensitive'
  | 'users.manage_status'
  | 'users.manage_roles'
  | 'users.view_audit'
  | 'roles.assign_standard'
  | 'roles.assign_privileged'
  | 'roles.assign_owner'
  | 'roles.revoke'
  | 'audit.read'
  | 'cms.view'
  | 'cms.records.create'
  | 'cms.records.edit'
  | 'cms.records.delete'
  | 'cms.import.run'
  | 'cms.history.view'
  | 'cms.history.restore'
  | 'cms.publish'
  | 'cms.analytics.view'
  | 'platform.users.manage'
  | 'moderation.manage'
  | 'render_engine.view'
  | 'render_engine.inspect'
  | 'render_engine.calibrate'
  | 'render_engine.manage_profiles'
  | 'vision.admin.read'
  | 'vision.admin.edit'
  | 'vision.admin.test'
  | 'vision.admin.publish'
  | 'vision.scan.create'
  | 'vision.scan.review-own'
  | 'vision.evidence.review'
  | 'community_art.moderate'
  | 'community_art.approve'
  | 'beta.access'
  | 'contributions.submit'
  | 'applications.read'
  | 'applications.review'
  | 'applications.request_information'
  | 'applications.change_status'
  | 'applications.assign_reviewer'
  | 'applications.view_internal_notes'
  | 'applications.manage_onboarding'
  | 'applications.manage_role_catalogue'

type RoleContextValue = {
  role: ForgePlatformRole
  roles: ForgePlatformRole[]
  permissions: ForgePermission[]
  loadingRole: boolean
  roleError: string | null

  isOwner: boolean
  isAdmin: boolean
  canViewCms: boolean
  canEditRecords: boolean
  canPublish: boolean
  canAccessBeta: boolean

  hasPermission: (
    permission: ForgePermission,
  ) => boolean

  refreshRole: () => Promise<void>
}

const RoleContext = createContext<
  RoleContextValue | undefined
>(undefined)

type RoleProviderProps = {
  children: ReactNode
}

type ForgeRolePermissionRow = {
  role: ForgePlatformRole
  permission_key: ForgePermission
}

export function RoleProvider({
  children,
}: RoleProviderProps) {
  const { user, loading: authLoading } = useAuth()
  const { pathname } = useLocation()
  const isVisionAcceptanceRoute = pathname === '/admin/vision/account-linking-acceptance'

  const [role, setRole] =
    useState<ForgePlatformRole>('viewer')

  const [roles, setRoles] = useState<ForgePlatformRole[]>(['viewer'])

  const [permissions, setPermissions] = useState<
    ForgePermission[]
  >([])

  const [loadingRole, setLoadingRole] = useState(true)

  const [roleError, setRoleError] = useState<
    string | null
  >(null)

  const refreshRole = useCallback(async () => {
    if (!user) {
      setRole('viewer')
      setRoles(['viewer'])
      setPermissions([])
      setRoleError(null)
      setLoadingRole(false)
      return
    }

    setLoadingRole(true)
    setRoleError(null)

    const { data: accessData, error: accessError } = await supabase.rpc('get_my_forge_access')

    if (accessError) {
      console.error(
        'Unable to load Forge platform role:',
        accessError.message,
      )

      setRole('viewer')
      setRoles(['viewer'])
      setPermissions([])
      setRoleError(
        'Unable to load your Forge permissions.',
      )
      setLoadingRole(false)
      return
    }

    const accessRows = (accessData ?? []) as ForgeRolePermissionRow[]
    const resolvedRoles = [...new Set(accessRows.map((item) => item.role))]
    const resolvedRole = resolvedRoles.includes('owner') ? 'owner' : resolvedRoles.includes('admin') ? 'admin' : resolvedRoles[0] ?? 'viewer'
    const resolvedPermissions = [...new Set(accessRows.map((item) => item.permission_key))]

    setRole(resolvedRole)
    setRoles(resolvedRoles.length > 0 ? resolvedRoles : ['viewer'])
    setPermissions(resolvedPermissions)
    setLoadingRole(false)
  }, [user])

  useEffect(() => {
    if (authLoading) {
      return
    }

    void refreshRole()
  }, [authLoading, refreshRole])

  useEffect(() => {
    if (isVisionAcceptanceRoute) return
    const refreshIfVisible = () => { if (document.visibilityState === 'visible') void refreshRole() }
    window.addEventListener('focus', refreshIfVisible)
    document.addEventListener('visibilitychange', refreshIfVisible)
    window.addEventListener('forge-capabilities-changed', refreshIfVisible)
    return () => { window.removeEventListener('focus', refreshIfVisible); document.removeEventListener('visibilitychange', refreshIfVisible); window.removeEventListener('forge-capabilities-changed', refreshIfVisible) }
  }, [isVisionAcceptanceRoute, refreshRole])

  const hasPermission = useCallback(
    (permission: ForgePermission) =>
      permissions.includes(permission),
    [permissions],
  )

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      roles,
      permissions,
      loadingRole,
      roleError,

      isOwner: role === 'owner',

      isAdmin:
        role === 'owner' || role === 'admin',

      canViewCms: hasPermission('cms.view'),

      canEditRecords:
        hasPermission('cms.records.create') ||
        hasPermission('cms.records.edit'),

      canPublish: hasPermission('cms.publish'),

      canAccessBeta: hasPermission('beta.access'),

      hasPermission,
      refreshRole,
    }),
    [
      role,
      roles,
      permissions,
      loadingRole,
      roleError,
      hasPermission,
      refreshRole,
    ],
  )

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)

  if (!context) {
    throw new Error(
      'useRole must be used inside a RoleProvider.',
    )
  }

  return context
}
