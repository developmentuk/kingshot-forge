import type { ForgeActor } from '../auth/requireForgeActor.js'
import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { notifyIdentityMutation } from '../notifications/notificationService.js'
import { LinkedPlayerServiceError, lookupKingshotPlayer, validateKingdomId, validatePlayerId } from '../player-identity/linkedPlayerService.js'
import { canAssignRole, dedupeCapabilities, isForgeRole, workspaceIdsForCapabilities, type ForgeRole } from './roleCapabilities.js'
import type { AccountStatus, UserAuditEntry, UserDetail, UserListItem, UserRoleAssignment } from './contracts.js'

const PAGE_SIZE_MAX = 50
type PlayerRow = { id: string; user_id: string; player_id: string; player_name: string; kingdom_id: number; verification_status: string; verified_at: string | null; is_primary: boolean }
type ManagedPlayerInput = Readonly<Record<string, unknown>>
export class UserManagementError extends Error {
  constructor(readonly statusCode: number, message: string) { super(message); this.name = 'UserManagementError' }
}

function requireCapability(actor: ForgeActor, capability: string) {
  if (!actor.capabilities.includes(capability)) throw new UserManagementError(403, 'You do not have permission to manage Forge identities.')
  if (actor.accountStatus !== 'active') throw new UserManagementError(403, 'Your account is not active for privileged operations.')
}

function maskPlayerId(playerId: string) {
  const value = playerId.trim()
  return value.length <= 4 ? '••••' : `${'•'.repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`
}

function safeEmail(email: string | undefined, canReadSensitive: boolean) {
  if (!email) return null
  if (canReadSensitive) return email
  const [local, domain] = email.split('@')
  if (!domain) return null
  return `${local.slice(0, 1)}•••@${domain}`
}

function roleRows(rows: Array<{ user_id: string; role: string; id?: string; active?: boolean; granted_at?: string; grant_reason?: string; revoked_at?: string | null; revoke_reason?: string | null }>, userId: string) {
  return rows.filter((row) => row.user_id === userId && isForgeRole(row.role))
}

async function accessForUsers(userIds: string[]) {
  const admin = getSupabaseAdmin()
  if (userIds.length === 0) return new Map<string, { roles: ForgeRole[]; capabilities: string[] }>()
  const [{ data: assignments }, { data: legacy }] = await Promise.all([
    admin.from('forge_user_role_assignments').select('user_id,role').in('user_id', userIds).eq('active', true),
    admin.from('forge_user_roles').select('user_id,role').in('user_id', userIds),
  ])
  const roleValues = [...new Set([...(assignments ?? []), ...(legacy ?? [])].map((row) => row.role).filter(isForgeRole))]
  const { data: permissionRows } = roleValues.length > 0 ? await admin.from('forge_role_permissions').select('role,permission_key').in('role', roleValues) : { data: [] }
  const result = new Map<string, { roles: ForgeRole[]; capabilities: string[] }>()
  for (const userId of userIds) {
    const roles = [...new Set([...roleRows(assignments ?? [], userId), ...roleRows(legacy ?? [], userId)].map((row) => row.role as ForgeRole))]
    const capabilities = dedupeCapabilities((permissionRows ?? []).filter((row) => roles.includes(row.role as ForgeRole)).map((row) => row.permission_key))
    result.set(userId, { roles: roles.length > 0 ? roles : ['viewer'], capabilities })
  }
  return result
}

async function projectUsers(actor: ForgeActor, users: Array<{ id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; created_at: string; last_sign_in_at?: string; email_confirmed_at?: string }>) {
  const admin = getSupabaseAdmin()
  const ids = users.map((user) => user.id)
  const [{ data: profiles }, { data: players }, { data: statuses }, { data: consents }] = await Promise.all([
    admin.from('profiles').select('id,display_name,avatar_url,alliance').in('id', ids),
    admin.from('player_accounts').select('id,user_id,player_id,player_name,kingdom_id,verification_status,verified_at,is_primary').in('user_id', ids),
    admin.from('forge_user_account_status').select('user_id,status').in('user_id', ids),
    admin.from('gift_code_redemption_consents').select('user_id').in('user_id', ids).is('revoked_at', null),
  ])
  const access = await accessForUsers(ids)
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const playersByUser = new Map<string, PlayerRow[]>()
  for (const player of players ?? []) playersByUser.set(player.user_id, [...(playersByUser.get(player.user_id) ?? []), player])
  const statusById = new Map((statuses ?? []).map((status) => [status.user_id, status.status as AccountStatus]))
  const consentUsers = new Set((consents ?? []).map((consent) => consent.user_id))
  return users.map<UserListItem>((user) => {
    const profile = profileById.get(user.id)
    const userAccess = access.get(user.id) ?? { roles: ['viewer' as ForgeRole], capabilities: [] }
    const linkedPlayers = playersByUser.get(user.id) ?? []
    const primary = linkedPlayers.find((player) => player.is_primary) ?? linkedPlayers[0]
    return {
      userId: user.id,
      displayName: profile?.display_name ?? String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Forge user'),
      safeEmail: safeEmail(user.email, actor.capabilities.includes('users.read_sensitive')),
      avatarUrl: profile?.avatar_url ?? null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      accountStatus: statusById.get(user.id) ?? 'active',
      roles: userAccess.roles,
      capabilities: userAccess.capabilities,
      workspaces: workspaceIdsForCapabilities(userAccess.roles, userAccess.capabilities),
      linkedPlayerCount: linkedPlayers.length,
      verifiedPlayer: linkedPlayers.some((player) => ['verified', 'officially_verified', 'community_verified'].includes(player.verification_status)),
      kingdom: primary?.kingdom_id ?? null,
      alliance: profile?.alliance ?? null,
      contributor: userAccess.roles.includes('contributor'),
      creator: userAccess.roles.includes('content_creator'),
      moderator: userAccess.roles.includes('moderator'),
      autoRedeemConsent: consentUsers.has(user.id) ? 'active' : 'inactive',
    }
  })
}

export async function listUsers(actor: ForgeActor, query: { search?: string; role?: string; status?: string; page?: string; pageSize?: string }) {
  requireCapability(actor, 'users.read')
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1)
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number.parseInt(query.pageSize ?? '20', 10) || 20))
  const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw new UserManagementError(502, 'The Forge identity directory is temporarily unavailable.')
  let projected = await projectUsers(actor, data.users)
  const search = query.search?.trim().toLowerCase()
  if (search) {
    const { data: matchingPlayers } = /^\d{1,20}$/u.test(search)
      ? await getSupabaseAdmin().from('player_accounts').select('user_id').eq('player_id', search)
      : { data: [] }
    const matchingUserIds = new Set((matchingPlayers ?? []).map((row) => row.user_id))
    projected = projected.filter((user) => matchingUserIds.has(user.userId) || [user.displayName, user.safeEmail ?? '', user.kingdom?.toString() ?? '', user.alliance ?? '', user.userId].some((value) => value.toLowerCase().includes(search)))
  }
  if (query.role && isForgeRole(query.role)) projected = projected.filter((user) => user.roles.includes(query.role as ForgeRole))
  if (query.status && ['active', 'restricted', 'suspended', 'deactivated'].includes(query.status)) projected = projected.filter((user) => user.accountStatus === query.status)
  const total = projected.length
  return { items: projected.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
}

async function getUser(actor: ForgeActor, userId: string) {
  requireCapability(actor, 'users.read')
  const { data, error } = await getSupabaseAdmin().auth.admin.getUserById(userId)
  if (error || !data.user) throw new UserManagementError(404, 'Forge user not found.')
  const [item] = await projectUsers(actor, [data.user])
  if (!item) throw new UserManagementError(404, 'Forge user not found.')
  const admin = getSupabaseAdmin()
  const [{ data: players }, { data: assignments }, { data: audit }] = await Promise.all([
    admin.from('player_accounts').select('id,player_id,player_name,kingdom_id,verification_status,verified_at,is_primary').eq('user_id', userId),
    admin.from('forge_user_role_assignments').select('id,role,active,granted_at,grant_reason,revoked_at,revoke_reason').eq('user_id', userId).order('granted_at', { ascending: false }),
    actor.capabilities.includes('users.view_audit') ? admin.from('forge_identity_audit_events').select('id,actor_user_id,target_user_id,action,domain,reason,before_state,after_state,created_at').eq('target_user_id', userId).order('created_at', { ascending: false }).limit(50) : { data: [] },
  ])
  const detail: UserDetail = {
    ...item,
    providerNames: [String(data.user.app_metadata?.provider ?? 'OAuth')],
    emailConfirmed: Boolean(data.user.email_confirmed_at),
    canManagePlayers: actor.capabilities.includes('users.manage_players'),
    linkedPlayers: (players ?? []).map((player) => ({ playerAccountId: player.id, maskedPlayerId: maskPlayerId(player.player_id), playerName: player.player_name, kingdom: player.kingdom_id, verificationStatus: player.verification_status, verificationDate: player.verified_at, isPrimary: player.is_primary })),
    assignments: ((assignments ?? []) as Array<{ id: string; role: string; active: boolean; granted_at: string; grant_reason: string; revoked_at: string | null; revoke_reason: string | null }>).filter((assignment) => isForgeRole(assignment.role)).map<UserRoleAssignment>((assignment) => ({ id: assignment.id, role: assignment.role as ForgeRole, active: assignment.active, grantedAt: assignment.granted_at, grantReason: assignment.grant_reason, revokedAt: assignment.revoked_at, revokeReason: assignment.revoke_reason })),
    audit: ((audit ?? []) as Array<{ id: string; actor_user_id: string; target_user_id: string; action: string; domain: string; reason: string; before_state: Record<string, unknown>; after_state: Record<string, unknown>; created_at: string }>).map<UserAuditEntry>((entry) => ({ id: entry.id, actorUserId: entry.actor_user_id, targetUserId: entry.target_user_id, action: entry.action, domain: entry.domain, reason: entry.reason, beforeState: entry.before_state, afterState: entry.after_state, createdAt: entry.created_at })),
    safeRecentActivity: [],
  }
  return detail
}

function requireTargetExists(userId: string) {
  return getSupabaseAdmin().auth.admin.getUserById(userId).then(({ data, error }) => { if (error || !data.user) throw new UserManagementError(404, 'Forge user not found.'); return data.user })
}

function requireReason(reason: unknown): string {
  if (typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 2000) throw new UserManagementError(400, 'A mutation reason of 3 to 2000 characters is required.')
  return reason.trim()
}

function playerInput(input: ManagedPlayerInput) {
  try {
    return {
      playerId: validatePlayerId(input.playerId),
      kingdomId: validateKingdomId(input.kingdomId ?? input.state),
    }
  } catch (error) {
    if (error instanceof LinkedPlayerServiceError) throw new UserManagementError(error.statusCode, error.message)
    throw error
  }
}

function optionalText(value: unknown, maximum = 240) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text) return null
  if (text.length > maximum) throw new UserManagementError(422, `Text values must be ${maximum} characters or fewer.`)
  return text
}

function mapLookupError(error: unknown): never {
  if (error instanceof LinkedPlayerServiceError) throw new UserManagementError(error.statusCode, error.message)
  throw error
}

export async function lookupManagedPlayer(actor: ForgeActor, input: ManagedPlayerInput) {
  requireCapability(actor, 'users.manage_players')
  const { playerId, kingdomId } = playerInput(input)
  try {
    const player = await lookupKingshotPlayer(playerId, kingdomId)
    return { source: player.provider, player }
  } catch (error) {
    return mapLookupError(error)
  }
}

export async function linkManagedPlayer(actor: ForgeActor, targetUserId: string, input: ManagedPlayerInput) {
  requireCapability(actor, 'users.manage_players')
  if (input.mode === 'lookup') {
    throw new UserManagementError(
      409,
      'Provider-backed administrator linking is pending the governed admin-link contract update. Lookup details remains available and does not change the Player Account.',
    )
  }
  if (input.mode !== 'manual') throw new UserManagementError(400, 'Choose manual administrator verification.')
  const target = await requireTargetExists(targetUserId)
  const reason = requireReason(input.reason)
  const { playerId, kingdomId } = playerInput(input)
  const admin = getSupabaseAdmin()
  const { data: existingPlayer, error: existingPlayerError } = await admin
    .from('player_accounts')
    .select('player_name')
    .eq('user_id', targetUserId)
    .maybeSingle()
  if (existingPlayerError) throw new UserManagementError(500, 'The existing Player Account could not be read safely.')

  const { data: profile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', targetUserId)
    .maybeSingle()
  const playerName = optionalText(input.playerName, 120)
    ?? optionalText(existingPlayer?.player_name, 120)
    ?? optionalText(profile?.display_name, 120)
    ?? optionalText(target.user_metadata?.full_name, 120)
    ?? optionalText(target.user_metadata?.name, 120)
    ?? target.email?.split('@')[0]
    ?? `Player ${playerId.slice(-4)}`

  const { data, error } = await getSupabaseAdmin().rpc('admin_link_player_account', {
    p_actor_user_id: actor.userId,
    p_target_user_id: targetUserId,
    p_player_id: playerId,
    p_kingdom_id: kingdomId,
    p_player_name: playerName,
    p_player_level: null,
    p_level_rendered: null,
    p_level_rendered_detailed: null,
    p_level_image: null,
    p_profile_photo: null,
    p_verification_status: 'community_verified',
    p_verification_method: 'forge_admin',
    p_reason: reason,
    p_replace_existing: input.replaceExisting === true,
  })
  if (error) {
    if (error.code === '42501') throw new UserManagementError(403, error.message)
    if (error.code === 'P0002') throw new UserManagementError(404, 'Forge user not found.')
    if (error.code === 'P0001' || error.code === '23505') throw new UserManagementError(409, error.message)
    if (error.code === '22023') throw new UserManagementError(422, error.message)
    throw new UserManagementError(500, 'The Player Account link could not be applied safely.')
  }
  return data
}

async function audit(actor: ForgeActor, targetUserId: string, action: string, reason: string, beforeState: Record<string, unknown>, afterState: Record<string, unknown>) {
  const { data, error } = await getSupabaseAdmin().from('forge_identity_audit_events').insert({ actor_user_id: actor.userId, target_user_id: targetUserId, action, domain: 'identity', reason, before_state: beforeState, after_state: afterState }).select('id').single()
  if (error) throw new UserManagementError(500, 'The identity mutation could not be audited and was not completed.')
  return data.id as string
}

export async function assignRole(actor: ForgeActor, targetUserId: string, roleInput: unknown, reasonInput: unknown) {
  requireCapability(actor, 'users.manage_roles')
  const role = typeof roleInput === 'string' && isForgeRole(roleInput) ? roleInput : null
  if (!role) throw new UserManagementError(400, 'A valid Forge role is required.')
  const reason = requireReason(reasonInput)
  const decision = canAssignRole(actor, targetUserId, role)
  if (!decision.ok) throw new UserManagementError(403, decision.message)
  await requireTargetExists(targetUserId)
  const admin = getSupabaseAdmin()
  const { data: existing } = await admin.from('forge_user_role_assignments').select('id,active').eq('user_id', targetUserId).eq('role', role).eq('active', true).maybeSingle()
  if (existing) return { idempotent: true, role }
  const { data, error } = await admin.from('forge_user_role_assignments').insert({ user_id: targetUserId, role, granted_by: actor.userId, grant_reason: reason }).select('id,role,active,granted_at').single()
  if (error) throw new UserManagementError(500, 'The role assignment could not be completed.')
  const auditEventId = await audit(actor, targetUserId, 'role_assigned', reason, {}, { role, assignmentId: data.id })
  void notifyIdentityMutation({ userId: targetUserId, action: 'role_assigned', roleOrStatus: role, auditEventId }).catch((error) => console.warn('[notifications]', error instanceof Error ? error.message : 'delivery failed'))
  return { idempotent: false, role, assignmentId: data.id }
}

export async function revokeRole(actor: ForgeActor, targetUserId: string, roleInput: unknown, reasonInput: unknown) {
  requireCapability(actor, 'users.manage_roles')
  const role = typeof roleInput === 'string' && isForgeRole(roleInput) ? roleInput : null
  if (!role) throw new UserManagementError(400, 'A valid Forge role is required.')
  const reason = requireReason(reasonInput)
  if (actor.userId === targetUserId) throw new UserManagementError(403, 'Users cannot revoke their own roles.')
  if (role === 'owner' && !actor.capabilities.includes('roles.assign_owner')) throw new UserManagementError(403, 'Only an explicitly authorized Owner can revoke Owner.')
  const admin = getSupabaseAdmin()
  const { count: ownerCount } = await admin.from('forge_user_role_assignments').select('id', { count: 'exact', head: true }).eq('role', 'owner').eq('active', true)
  if (role === 'owner' && (ownerCount ?? 0) <= 1) throw new UserManagementError(409, 'The final Owner cannot be removed.')
  const { data: current } = await admin.from('forge_user_role_assignments').select('id').eq('user_id', targetUserId).eq('role', role).eq('active', true).maybeSingle()
  if (!current) return { idempotent: true, role }
  const { error } = await admin.from('forge_user_role_assignments').update({ active: false, revoked_by: actor.userId, revoked_at: new Date().toISOString(), revoke_reason: reason }).eq('id', current.id)
  if (error) throw new UserManagementError(500, 'The role revocation could not be completed.')
  const auditEventId = await audit(actor, targetUserId, 'role_revoked', reason, { role }, { role, assignmentId: current.id })
  void notifyIdentityMutation({ userId: targetUserId, action: 'role_revoked', roleOrStatus: role, auditEventId }).catch((error) => console.warn('[notifications]', error instanceof Error ? error.message : 'delivery failed'))
  return { idempotent: false, role, assignmentId: current.id }
}

export async function changeAccountStatus(actor: ForgeActor, targetUserId: string, statusInput: unknown, reasonInput: unknown) {
  requireCapability(actor, 'users.manage_status')
  const status = typeof statusInput === 'string' && ['active', 'restricted', 'suspended', 'deactivated'].includes(statusInput) ? statusInput as AccountStatus : null
  if (!status) throw new UserManagementError(400, 'A valid account status is required.')
  if (actor.userId === targetUserId) throw new UserManagementError(403, 'Users cannot change their own account status.')
  const reason = requireReason(reasonInput)
  await requireTargetExists(targetUserId)
  const admin = getSupabaseAdmin()
  const { data: targetRoles } = await admin.from('forge_user_role_assignments').select('role').eq('user_id', targetUserId).eq('active', true)
  if ((targetRoles ?? []).some((row) => row.role === 'owner') && !actor.capabilities.includes('roles.assign_owner')) throw new UserManagementError(403, 'Administrators cannot change the Owner account status.')
  const { data: previous } = await admin.from('forge_user_account_status').select('status').eq('user_id', targetUserId).maybeSingle()
  if (previous?.status === status) return { idempotent: true, status }
  const { error } = await admin.from('forge_user_account_status').upsert({ user_id: targetUserId, status, changed_by: actor.userId, changed_at: new Date().toISOString(), reason, updated_at: new Date().toISOString() })
  if (error) throw new UserManagementError(500, 'The account status change could not be completed.')
  const auditEventId = await audit(actor, targetUserId, 'account_status_changed', reason, { status: previous?.status ?? 'active' }, { status })
  void notifyIdentityMutation({ userId: targetUserId, action: 'account_status_changed', roleOrStatus: status, auditEventId }).catch((error) => console.warn('[notifications]', error instanceof Error ? error.message : 'delivery failed'))
  return { idempotent: false, status }
}

export async function getUserDetail(actor: ForgeActor, userId: string) { return getUser(actor, userId) }

export function roleCatalogue(actor: ForgeActor) {
  requireCapability(actor, 'users.read')
  return [
    ['viewer', 'Player access with no internal operations.'], ['contributor', 'Approved contribution access.'], ['content_creator', 'Creator workflow access.'], ['beta_tester', 'Explicit beta access.'], ['moderator', 'Community moderation access.'], ['admin', 'Platform administration without Owner authority.'], ['owner', 'Full platform authority; Owner assignment is Owner-only.'],
  ].map(([role, description]) => ({ role, description, assignable: isForgeRole(role) && actor.capabilities.includes(role === 'owner' ? 'roles.assign_owner' : role === 'admin' || role === 'moderator' || role === 'content_creator' ? 'roles.assign_privileged' : 'roles.assign_standard') }))
}
