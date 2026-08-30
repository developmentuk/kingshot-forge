import { createHash } from 'node:crypto'
import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { createMightPulsePlayerProvider } from '../player-identity/providers/mightPulsePlayerProvider.js'
import {
  PlayerProviderError,
  type NormalizedPlayerIntelligence,
  type PlayerIntelligenceProvider,
} from '../player-identity/providers/playerProvider.js'
import {
  hasNewVerifiedSignIn,
  validateKingdomId,
  validatePlayerId,
} from '../player-identity/linkedPlayerService.js'
import {
  isProviderQuotaRuntimeEnabled,
  reserveMightPulseProviderRequest,
  signInProviderIdempotencyKey,
  type ProviderQuotaPriority,
  type ProviderQuotaRepository,
  type ProviderQuotaReservation,
  type ProviderRequestCategory,
} from './providerQuota.js'
import {
  mapMightPulseAllianceRank,
  type ForgeAllianceMemberRole,
} from '../../shared/domains/player-identity/mightPulseAllianceRank.js'

export const PLAYER_INTELLIGENCE_SNAPSHOT_VERSION =
  'mightpulse-player-intelligence-v1' as const

export const PLAYER_INTELLIGENCE_SECTIONS = Object.freeze([
  'base',
  'heroes',
  'ranks',
  'gov_gear',
] as const)

export type PlayerIntelligenceRefreshReason =
  | 'sign-in'
  | 'automatic'
  | 'manual'
  | 'intelligence'

export type LinkedPlayerIdentity = Readonly<{
  playerAccountId: string
  playerId: string
  kingdomId: number
  lastRefreshedAt: string | null
}>

export type PlayerIntelligenceObservationWrite = Readonly<{
  playerAccountId: string
  provider: 'mightpulse'
  requestReason: PlayerIntelligenceRefreshReason
  sections: readonly string[]
  normalizedSnapshot: Readonly<Record<string, unknown>>
  contentSha256: string
  providerFetchedAt: string
  providerCachedAt: string | null
  providerAgeSeconds: number | null
  providerFresh: boolean | null
}>

export type AllianceAuthoritySyncResult = Readonly<{
  allianceId: string | null
  membershipId: string | null
  memberRole: ForgeAllianceMemberRole | null
  adminActive: boolean
}>

export type PlayerIntelligenceApplyWrite = Readonly<{
  userId: string
  playerAccountId: string
  requestReason: PlayerIntelligenceRefreshReason
  intelligence: NormalizedPlayerIntelligence
  normalizedSnapshot: Readonly<Record<string, unknown>>
  contentSha256: string
  applyAllianceAuthority: boolean
  allianceTag: string | null
  allianceName: string | null
  memberRole: ForgeAllianceMemberRole | null
  authorityObservedAt: string | null
}>

export interface PlayerIntelligenceRepository {
  loadPrimaryLinkedPlayer(userId: string): Promise<LinkedPlayerIdentity | null>
  applySync(input: PlayerIntelligenceApplyWrite): Promise<Readonly<{
    observationId: string
    allianceAuthority: AllianceAuthoritySyncResult | null
  }>>
}

function stableJson(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Player intelligence canonical JSON requires finite numbers.')
    }
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableJson).join(',') + ']'
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) => JSON.stringify(key) + ':' + stableJson(item))
    return '{' + entries.join(',') + '}'
  }
  throw new Error(
    'Player intelligence canonical JSON does not support ' + typeof value + ' values.',
  )
}

export function projectPlayerIntelligenceSnapshot(
  intelligence: NormalizedPlayerIntelligence,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    schemaVersion: PLAYER_INTELLIGENCE_SNAPSHOT_VERSION,
    identity: Object.freeze({
      playerId: intelligence.identity.playerId,
      name: intelligence.identity.name,
      kingdomId: intelligence.identity.kingdomId,
      townCenterLevel: intelligence.identity.townCenterLevel,
      avatarUrl: intelligence.identity.avatarUrl,
    }),
    base: intelligence.base,
    heroes: intelligence.heroes,
    ranks: intelligence.ranks,
    governorGear: intelligence.governorGear,
  })
}

export function hashPlayerIntelligenceSnapshot(
  snapshot: Readonly<Record<string, unknown>>,
): string {
  return createHash('sha256')
    .update(
      PLAYER_INTELLIGENCE_SNAPSHOT_VERSION
      + '\n'
      + stableJson(snapshot),
    )
    .digest('hex')
}

export function quotaClassForPlayerIntelligenceReason(
  reason: PlayerIntelligenceRefreshReason,
): Readonly<{
  category: ProviderRequestCategory
  priority: ProviderQuotaPriority
}> {
  switch (reason) {
    case 'sign-in':
      return { category: 'player_sign_in', priority: 'high' }
    case 'manual':
      return { category: 'player_manual', priority: 'high' }
    case 'automatic':
      return { category: 'player_automatic', priority: 'low' }
    case 'intelligence':
      return { category: 'player_intelligence', priority: 'normal' }
  }
}

export class SupabasePlayerIntelligenceRepository
implements PlayerIntelligenceRepository {
  async loadPrimaryLinkedPlayer(
    userId: string,
  ): Promise<LinkedPlayerIdentity | null> {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('player_accounts')
      .select('id,player_id,kingdom_id,last_refreshed_at')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      playerAccountId: String(data.id),
      playerId: validatePlayerId(data.player_id),
      kingdomId: validateKingdomId(data.kingdom_id),
      lastRefreshedAt: typeof data.last_refreshed_at === 'string'
        ? data.last_refreshed_at
        : null,
    }
  }

  async applySync(
    input: PlayerIntelligenceApplyWrite,
  ): Promise<Readonly<{
    observationId: string
    allianceAuthority: AllianceAuthoritySyncResult | null
  }>> {
    const admin = getSupabaseAdmin()
    const identity = input.intelligence.identity
    const { data, error } = await admin.rpc(
      'apply_mightpulse_player_intelligence_sync',
      {
        p_user_id: input.userId,
        p_player_account_id: input.playerAccountId,
        p_player_id: identity.playerId,
        p_kingdom_number: identity.kingdomId,
        p_player_name: identity.name,
        p_town_center_level: identity.townCenterLevel,
        p_avatar_url: identity.avatarUrl,
        p_request_reason: input.requestReason,
        p_sections: [...PLAYER_INTELLIGENCE_SECTIONS],
        p_normalized_snapshot: input.normalizedSnapshot,
        p_content_sha256: input.contentSha256,
        p_provider_fetched_at: identity.providerFetchedAt,
        p_provider_cached_at: input.intelligence.providerCachedAt,
        p_provider_age_seconds: input.intelligence.providerAgeSeconds,
        p_provider_fresh: input.intelligence.providerFresh,
        p_apply_alliance_authority: input.applyAllianceAuthority,
        p_alliance_tag: input.allianceTag,
        p_alliance_name: input.allianceName,
        p_member_role: input.memberRole,
        p_authority_observed_at: input.authorityObservedAt,
      },
    )
    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    if (!row || typeof row !== 'object') {
      throw new Error('Player intelligence sync returned an invalid result.')
    }

    const value = row as Record<string, unknown>
    if (typeof value.observation_id !== 'string') {
      throw new Error('Player intelligence sync did not return an observation.')
    }

    const allianceId = value.alliance_id
    const membershipId = value.membership_id
    const memberRole = value.member_role
    const adminActive = value.admin_active

    if (
      (allianceId !== null && typeof allianceId !== 'string')
      || (membershipId !== null && typeof membershipId !== 'string')
      || (
        memberRole !== null
        && memberRole !== 'member'
        && memberRole !== 'recruiter'
        && memberRole !== 'officer'
        && memberRole !== 'r4'
        && memberRole !== 'leader'
      )
      || typeof adminActive !== 'boolean'
    ) {
      throw new Error('Player intelligence sync returned invalid Alliance authority.')
    }

    const allianceAuthority = input.applyAllianceAuthority
      ? {
          allianceId: allianceId as string | null,
          membershipId: membershipId as string | null,
          memberRole: memberRole as ForgeAllianceMemberRole | null,
          adminActive,
        }
      : null

    return {
      observationId: value.observation_id,
      allianceAuthority,
    }
  }
}

export function isPlayerIntelligenceRuntimeEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return (
    environment.MIGHTPULSE_PLAYER_INTELLIGENCE_ENABLED?.trim().toLowerCase()
      === 'true'
    && isProviderQuotaRuntimeEnabled(environment)
  )
}

export async function syncLinkedPlayerIntelligence(
  userId: string,
  reason: PlayerIntelligenceRefreshReason,
  dependencies: Readonly<{
    repository?: PlayerIntelligenceRepository
    provider?: PlayerIntelligenceProvider
    quotaRepository?: ProviderQuotaRepository
    verifiedLastSignInAt?: string | null
  }> = {},
): Promise<
  | Readonly<{ source: 'cache' }>
  | Readonly<{
      source: 'provider'
      observationId: string
      contentSha256: string
      intelligence: NormalizedPlayerIntelligence
      quota: ProviderQuotaReservation
      allianceAuthority: AllianceAuthoritySyncResult | null
    }>
> {
  const repository =
    dependencies.repository ?? new SupabasePlayerIntelligenceRepository()
  const provider =
    dependencies.provider ?? createMightPulsePlayerProvider()

  const linkedPlayer = await repository.loadPrimaryLinkedPlayer(userId)
  if (!linkedPlayer) {
    throw new PlayerProviderError(
      404,
      'NO_LINKED_PLAYER',
      'No linked Kingshot player was found.',
    )
  }

  if (
    reason === 'sign-in'
    && !hasNewVerifiedSignIn(
      dependencies.verifiedLastSignInAt,
      linkedPlayer.lastRefreshedAt,
    )
  ) {
    return Object.freeze({ source: 'cache' as const })
  }

  const quotaClass = quotaClassForPlayerIntelligenceReason(reason)
  const idempotencyKey = reason === 'sign-in'
    && dependencies.verifiedLastSignInAt
    ? signInProviderIdempotencyKey(
        userId,
        dependencies.verifiedLastSignInAt,
      )
    : null
  const quota = await reserveMightPulseProviderRequest(
    {
      ...quotaClass,
      idempotencyKey,
    },
    dependencies.quotaRepository,
  )
  if (quota.duplicate) {
    return Object.freeze({ source: 'cache' as const })
  }

  const intelligence = await provider.lookupPlayerIntelligence({
    playerId: linkedPlayer.playerId,
    expectedKingdomId: linkedPlayer.kingdomId,
  })

  if (
    intelligence.identity.playerId !== linkedPlayer.playerId
    || intelligence.identity.kingdomId !== linkedPlayer.kingdomId
  ) {
    throw new PlayerProviderError(
      502,
      'PLAYER_PROVIDER_INVALID_RESPONSE',
      'The player provider returned an inconsistent player record.',
      true,
    )
  }

  const snapshot = projectPlayerIntelligenceSnapshot(intelligence)
  const contentSha256 = hashPlayerIntelligenceSnapshot(snapshot)

  const alliance = intelligence.base.alliance
  const mappedRole = alliance
    ? mapMightPulseAllianceRank(alliance.rank)
    : null

  const providerFetchedAt = intelligence.identity.providerFetchedAt
  const cachedAtMs = intelligence.providerCachedAt === null
    ? Number.NaN
    : Date.parse(intelligence.providerCachedAt)
  const fetchedAtMs = Date.parse(providerFetchedAt)
  const authorityObservedAt = Number.isFinite(cachedAtMs)
    && Number.isFinite(fetchedAtMs)
    && cachedAtMs <= fetchedAtMs
    ? intelligence.providerCachedAt as string
    : providerFetchedAt

  const applyAllianceAuthority = !(alliance && mappedRole === null)
  const applied = await repository.applySync({
    userId,
    playerAccountId: linkedPlayer.playerAccountId,
    requestReason: reason,
    intelligence,
    normalizedSnapshot: snapshot,
    contentSha256,
    applyAllianceAuthority,
    allianceTag: alliance?.tag ?? null,
    allianceName: alliance?.name ?? null,
    memberRole: mappedRole,
    authorityObservedAt: applyAllianceAuthority
      ? authorityObservedAt
      : null,
  })

  return Object.freeze({
    source: 'provider' as const,
    observationId: applied.observationId,
    contentSha256,
    intelligence,
    quota,
    allianceAuthority: applied.allianceAuthority,
  })
}
