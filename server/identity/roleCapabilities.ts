export const FORGE_ROLES = [
  'owner', 'admin', 'moderator', 'content_creator', 'beta_tester', 'contributor', 'viewer',
] as const

export type ForgeRole = typeof FORGE_ROLES[number]

export const USER_MANAGEMENT_CAPABILITIES = [
  'users.read', 'users.read_sensitive', 'users.manage_status', 'users.manage_roles',
  'users.view_audit', 'roles.assign_standard', 'roles.assign_privileged',
  'roles.assign_owner', 'roles.revoke', 'audit.read',
] as const

export type ForgeCapability = string

export function isForgeRole(value: unknown): value is ForgeRole {
  return typeof value === 'string' && (FORGE_ROLES as readonly string[]).includes(value)
}

export function primaryRole(roles: readonly ForgeRole[]): ForgeRole {
  const priority = new Map<ForgeRole, number>([
    ['owner', 1], ['admin', 2], ['moderator', 3], ['content_creator', 4],
    ['contributor', 5], ['beta_tester', 6], ['viewer', 7],
  ])
  return [...roles].sort((a, b) => (priority.get(a) ?? 99) - (priority.get(b) ?? 99))[0] ?? 'viewer'
}

export function dedupeCapabilities(capabilities: readonly string[]) {
  return [...new Set(capabilities)].sort()
}

export function workspaceIdsForCapabilities(roles: readonly ForgeRole[], capabilities: readonly string[]) {
  const result = new Set(['player'])
  const has = (capability: string) => capabilities.includes(capability)
  if (roles.includes('owner') || roles.includes('admin') || has('cms.view') || has('platform.users.manage') || has('users.read')) result.add('operations')
  if (roles.includes('content_creator') || has('contributions.submit') || has('cms.records.edit')) result.add('creator')
  if (has('contributions.submit') || has('cms.records.edit')) result.add('contributor')
  if (has('moderation.manage') || has('moderation.act')) result.add('moderation')
  return [...result]
}

export function canAssignRole(actor: { userId: string; roles: readonly ForgeRole[]; capabilities: readonly string[] }, targetUserId: string, role: ForgeRole) {
  if (actor.userId === targetUserId) return { ok: false, message: 'Users cannot assign roles to themselves.' }
  if (role === 'owner' && !actor.capabilities.includes('roles.assign_owner')) return { ok: false, message: 'Only an explicitly authorized Owner can assign Owner.' }
  if (role !== 'owner' && !actor.capabilities.includes(role === 'admin' || role === 'moderator' || role === 'content_creator' ? 'roles.assign_privileged' : 'roles.assign_standard')) return { ok: false, message: 'Your permissions do not allow this role assignment.' }
  return { ok: true as const }
}
