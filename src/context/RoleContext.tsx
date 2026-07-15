import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
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
  | 'beta.access'
  | 'contributions.submit'

type RoleContextValue = {
  role: ForgePlatformRole
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

type ForgeUserRoleRow = {
  role: ForgePlatformRole
}

type ForgeRolePermissionRow = {
  permission_key: ForgePermission
}

export function RoleProvider({
  children,
}: RoleProviderProps) {
  const { user, loading: authLoading } = useAuth()

  const [role, setRole] =
    useState<ForgePlatformRole>('viewer')

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
      setPermissions([])
      setRoleError(null)
      setLoadingRole(false)
      return
    }

    setLoadingRole(true)
    setRoleError(null)

    const {
      data: roleData,
      error: roleQueryError,
    } = await supabase
      .from('forge_user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleQueryError) {
      console.error(
        'Unable to load Forge platform role:',
        roleQueryError.message,
      )

      setRole('viewer')
      setPermissions([])
      setRoleError(
        'Unable to load your Forge permissions.',
      )
      setLoadingRole(false)
      return
    }

    const resolvedRole =
      (roleData as ForgeUserRoleRow | null)?.role ??
      'viewer'

    const {
      data: permissionData,
      error: permissionQueryError,
    } = await supabase
      .from('forge_role_permissions')
      .select('permission_key')
      .eq('role', resolvedRole)

    if (permissionQueryError) {
      console.error(
        'Unable to load Forge role permissions:',
        permissionQueryError.message,
      )

      setRole(resolvedRole)
      setPermissions([])
      setRoleError(
        'Your role was loaded, but its permissions could not be loaded.',
      )
      setLoadingRole(false)
      return
    }

    const resolvedPermissions = (
      (permissionData ?? []) as ForgeRolePermissionRow[]
    ).map((item) => item.permission_key)

    setRole(resolvedRole)
    setPermissions(resolvedPermissions)
    setLoadingRole(false)
  }, [user])

  useEffect(() => {
    if (authLoading) {
      return
    }

    void refreshRole()
  }, [authLoading, refreshRole])

  const hasPermission = useCallback(
    (permission: ForgePermission) =>
      permissions.includes(permission),
    [permissions],
  )

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
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