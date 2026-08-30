import { createHash } from 'node:crypto'
import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { createMightPulsePlayerProvider } from '../player-identity/providers/mightPulsePlayerProvider.js'
import {
  PlayerProviderError,
  type NormalizedPlayerIntelligence,
  type PlayerIntelligenceProvider,
} from '../player-identity/providers/playerProvider.js'
import {
  createProviderRefreshFields,
  hasNewVerifiedSignIn,
  validateKingdomId,
  validatePlayerId,
} from '../player-identity/linkedPlayerService.js'
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

export type ProviderQuotaPriority = 'high' | 'normal' | 'low'

export type ProviderQuotaReservation = Readonly<{
  allowed: boolean
  reservationId: string | null
  minuteUsed: number
  dayUsed: number
  minuteLimit: number
  dayLimit: number
  normalDayLimit: number
}>

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

export interface PlayerIntelligenceRepository {
  loadPrimaryLinkedPlayer(userId: string): Promise<LinkedPlayerIdentity | null>
  reserveProviderRequest(input: Readonly<{
    category:
      | 'player_sign_in'
      | 'player_manual'
      | 'player_automatic'
      | 'player_intelligence'
    priority: ProviderQuotaPriority
  }>): Promise<ProviderQuotaReservation>
  updateLinkedPlayerIdentity(input: Readonly<{
    userId: string
    playerAccountId: string
    player: NormalizedPlayerIntelligence['identity']
  }>): Promise<void>
  appendObservation(input: PlayerIntelligenceObservationWrite): Promise<string>
  syncAllianceAuthority(input: Readonly<{
    userId: string
    playerAccountId: string
    kingdomId: number
    allianceTag: string | null
    allianceName: string | null
    memberRole: ForgeAllianceMemberRole | null
    observedAt: string
    fetchedAt: string
  }>): Promise<AllianceAuthoritySyncResult>
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
  category:
    | 'player_sign_in'
    | 'player_manual'
    | 'player_automatic'
    | 'player_intelligence'
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

  async reserveProviderRequest(
    input: Readonly<{
      category:
        | 'player_sign_in'
        | 'player_manual'
        | 'player_automatic'
        | 'player_intelligence'
      priority: ProviderQuotaPriority
    }>,
  ): Promise<ProviderQuotaReservation> {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.rpc(
      'reserve_provider_request',
      {
        p_provider: 'mightpulse',
        p_category: input.category,
        p_priority: input.priority,
      },
    )
    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    if (!row || typeof row !== 'object') {
      throw new Error('Provider quota reservation returned an invalid result.')
    }

    const value = row as Record<string, unknown>
    if (
      typeof value.allowed !== 'boolean'
      || (value.reservation_id !== null && typeof value.reservation_id !== 'string')
      || typeof value.minute_used !== 'number'
      || !Number.isInteger(value.minute_used)
      || typeof value.day_used !== 'number'
      || !Number.isInteger(value.day_used)
      || typeof value.minute_limit !== 'number'
      || !Number.isInteger(value.minute_limit)
      || typeof value.day_limit !== 'number'
      || !Number.isInteger(value.day_limit)
      || typeof value.normal_day_limit !== 'number'
      || !Number.isInteger(value.normal_day_limit)
    ) {
      throw new Error('Provider quota reservation returned an invalid result.')
    }

    return {
      allowed: value.allowed,
      reservationId: value.reservation_id as string | null,
      minuteUsed: Number(value.minute_used),
      dayUsed: Number(value.day_used),
      minuteLimit: Number(value.minute_limit),
      dayLimit: Number(value.day_limit),
      normalDayLimit: Number(value.normal_day_limit),
    }
  }

  async updateLinkedPlayerIdentity(
    input: Readonly<{
      userId: string
      playerAccountId: string
      player: NormalizedPlayerIntelligence['identity']
    }>,
  ): Promise<void> {
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('player_accounts')
      .update(createProviderRefreshFields(input.player))
      .eq('id', input.playerAccountId)
      .eq('user_id', input.userId)
      .eq('is_primary', true)

    if (error) throw error
  }

  async appendObservation(
    input: PlayerIntelligenceObservationWrite,
  ): Promise<string> {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('player_intelligence_observations')
      .insert({
        player_account_id: input.playerAccountId,
        provider: input.provider,
        request_reason: input.requestReason,
        sections: [...input.sections],
        normalized_snapshot: input.normalizedSnapshot,
        content_sha256: input.contentSha256,
        provider_fetched_at: input.providerFetchedAt,
        provider_cached_at: input.providerCachedAt,
        provider_age_seconds: input.providerAgeSeconds,
        provider_fresh: input.providerFresh,
      })
      .select('id')
      .single()

    if (error) throw error
    if (!data?.id) {
      throw new Error('Player intelligence observation was not persisted.')
    }
    return String(data.id)
  }


  async syncAllianceAuthority(
    input: Readonly<{
      userId: string
      playerAccountId: string
      kingdomId: number
      allianceTag: string | null
      allianceName: string | null
      memberRole: ForgeAllianceMemberRole | null
      observedAt: string
      fetchedAt: string
    }>,
  ): Promise<AllianceAuthoritySyncResult> {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.rpc(
      'sync_mightpulse_alliance_membership',
      {
        p_user_id: input.userId,
        p_player_account_id: input.playerAccountId,
        p_kingdom_number: input.kingdomId,
        p_alliance_tag: input.allianceTag,
        p_alliance_name: input.allianceName,
        p_member_role: input.memberRole,
        p_observed_at: input.observedAt,
        p_fetched_at: input.fetchedAt,
      },
    )
    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    if (!row || typeof row !== 'object') {
      throw new Error('Alliance authority sync returned an invalid result.')
    }
    const value = row as Record<string, unknown>
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
      throw new Error('Alliance authority sync returned an invalid result.')
    }

    return {
      allianceId: allianceId as string | null,
      membershipId: membershipId as string | null,
      memberRole: memberRole as ForgeAllianceMemberRole | null,
      adminActive,
    }
  }
}

export function isPlayerIntelligenceRuntimeEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return environment.MIGHTPULSE_PLAYER_INTELLIGENCE_ENABLED?.trim().toLowerCase()
    === 'true'
}

export async function syncLinkedPlayerIntelligence(
  userId: string,
  reason: PlayerIntelligenceRefreshReason,
  dependencies: Readonly<{
    repository?: PlayerIntelligenceRepository
    provider?: PlayerIntelligenceProvider
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
  const quota = await repository.reserveProviderRequest(quotaClass)
  if (!quota.allowed) {
    throw new PlayerProviderError(
      429,
      'PLAYER_PROVIDER_QUOTA_EXHAUSTED',
      'The player intelligence refresh budget is temporarily exhausted. Cached data is still available.',
      true,
    )
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

  await repository.updateLinkedPlayerIdentity({
    userId,
    playerAccountId: linkedPlayer.playerAccountId,
    player: intelligence.identity,
  })

  const snapshot = projectPlayerIntelligenceSnapshot(intelligence)
  const contentSha256 = hashPlayerIntelligenceSnapshot(snapshot)
  const observationId = await repository.appendObservation({
    playerAccountId: linkedPlayer.playerAccountId,
    provider: 'mightpulse',
    requestReason: reason,
    sections: PLAYER_INTELLIGENCE_SECTIONS,
    normalizedSnapshot: snapshot,
    contentSha256,
    providerFetchedAt: intelligence.identity.providerFetchedAt,
    providerCachedAt: intelligence.providerCachedAt,
    providerAgeSeconds: intelligence.providerAgeSeconds,
    providerFresh: intelligence.providerFresh,
  })

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

  const allianceAuthority = alliance && mappedRole === null
    ? null
    : await repository.syncAllianceAuthority({
        userId,
        playerAccountId: linkedPlayer.playerAccountId,
        kingdomId: linkedPlayer.kingdomId,
        allianceTag: alliance?.tag ?? null,
        allianceName: alliance?.name ?? null,
        memberRole: mappedRole,
        observedAt: authorityObservedAt,
        fetchedAt: providerFetchedAt,
      })

  return Object.freeze({
    source: 'provider' as const,
    observationId,
    contentSha256,
    intelligence,
    quota,
    allianceAuthority,
  })
}
