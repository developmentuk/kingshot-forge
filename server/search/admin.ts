import type { ForgeActor, ForgeActorRole } from '../auth/requireForgeActor.js'
import type { SearchPermissionContext } from '../../shared/search/contracts.js'

const SUPPORTED_ROLES: readonly ForgeActorRole[] = ['owner', 'admin', 'moderator', 'content_creator', 'beta_tester', 'contributor', 'viewer']

export class SearchSimulationError extends Error { readonly statusCode = 403; constructor(message: string) { super(message) } }

export function canManageSearch(actor: ForgeActor): boolean {
  return (actor.role === 'owner' || actor.role === 'admin') && actor.permissionKeys.includes('cms.view')
}

export async function resolveSearchPermissionContext(actor: ForgeActor, requestedRole: string | undefined, loadPermissions: (role: ForgeActorRole) => Promise<readonly string[]>): Promise<SearchPermissionContext> {
  if (!requestedRole || requestedRole === actor.role) return { userId: actor.userId, roles: actor.roles, permissions: actor.permissionKeys, isAdmin: actor.role === 'owner' || actor.role === 'admin' }
  if (!canManageSearch(actor)) throw new SearchSimulationError('Only authorised administrators may simulate Search permissions.')
  if (!SUPPORTED_ROLES.includes(requestedRole as ForgeActorRole)) throw new SearchSimulationError('The requested simulated role is not supported.')
  const permissions = await loadPermissions(requestedRole as ForgeActorRole)
  return { userId: actor.userId, roles: [requestedRole as ForgeActorRole], permissions, isAdmin: requestedRole === 'owner' || requestedRole === 'admin' }
}

