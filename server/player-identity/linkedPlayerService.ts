import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { createMightPulsePlayerProvider } from './providers/mightPulsePlayerProvider.js'
import {
  PlayerProviderError,
  type NormalizedPlayer,
  type PlayerProvider,
} from './providers/playerProvider.js'

const ACCOUNT_FIELDS = 'id,user_id,player_id,player_name,kingdom_id,player_level,town_center_level,level_rendered,level_rendered_detailed,level_image,profile_photo,verification_status,verification_method,verified_by,verified_at,last_refreshed_at,is_primary,is_public,created_at,updated_at'

export const PLAYER_PROVIDER_FRESHNESS_TTL_MS = 60 * 60 * 1000

type LookupRecord = Readonly<Record<string, unknown>>

export class LinkedPlayerServiceError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code = 'PLAYER_ACCOUNT_REQUEST_FAILED',
    readonly retryable = false,
  ) {
    super(message)
    this.name = 'LinkedPlayerServiceError'
  }
}

export function validatePlayerId(value: unknown): string {
  const playerId = typeof value === 'string' ? value.trim().replace(/\s+/gu, '') : ''
  if (!/^\d{1,20}$/u.test(playerId)) {
    throw new LinkedPlayerServiceError(422, 'Enter a valid Kingshot Player ID.', 'INVALID_PLAYER_ID')
  }
  return playerId
}

export function validateKingdomId(value: unknown): number {
  const kingdomId = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isInteger(kingdomId) || kingdomId < 1 || kingdomId > 9999) {
    throw new LinkedPlayerServiceError(422, 'Enter a valid Kingshot State between 1 and 9999.', 'INVALID_STATE')
  }
  return kingdomId
}

function record(value: unknown): LookupRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as LookupRecord
    : null
}

function mapProviderError(error: unknown): never {
  if (error instanceof PlayerProviderError) {
    throw new LinkedPlayerServiceError(error.statusCode, error.message, error.code, error.retryable)
  }
  throw error
}

const providerLookupsInFlight = new Map<string, Promise<NormalizedPlayer>>()

async function lookupPlayerSingleFlight(
  provider: PlayerProvider,
  playerId: string,
  expectedKingdomId: number,
): Promise<NormalizedPlayer> {
  const key = `${playerId}:${expectedKingdomId}`
  const existing = providerLookupsInFlight.get(key)
  if (existing) return existing

  const lookup = provider.lookupPlayer({ playerId, expectedKingdomId })
    .finally(() => {
      if (providerLookupsInFlight.get(key) === lookup) providerLookupsInFlight.delete(key)
    })
  providerLookupsInFlight.set(key, lookup)
  return lookup
}

export async function lookupKingshotPlayer(
  playerIdInput: unknown,
  kingdomIdInput: unknown,
  provider: PlayerProvider = createMightPulsePlayerProvider(),
): Promise<NormalizedPlayer> {
  const playerId = validatePlayerId(playerIdInput)
  const kingdomId = validateKingdomId(kingdomIdInput)
  try {
    return await lookupPlayerSingleFlight(provider, playerId, kingdomId)
  } catch (error) {
    return mapProviderError(error)
  }
}

export function isPlayerAccountFresh(
  lastRefreshedAt: unknown,
  nowMs = Date.now(),
): boolean {
  if (typeof lastRefreshedAt !== 'string') return false
  const refreshedAt = Date.parse(lastRefreshedAt)
  if (!Number.isFinite(refreshedAt)) return false
  const age = nowMs - refreshedAt
  return age >= 0 && age < PLAYER_PROVIDER_FRESHNESS_TTL_MS
}

export async function resolvePlayerRefresh(input: {
  action: 'link' | 'revalidate'
  existingAccount: LookupRecord | null
  playerId: string
  kingdomId: number
  forceProviderRefresh?: boolean
  provider: PlayerProvider
  nowMs?: number
}): Promise<{ source: 'cache'; player: null } | { source: 'provider'; player: NormalizedPlayer }> {
  if (
    input.action === 'revalidate'
    && input.existingAccount
    && input.forceProviderRefresh !== true
    && isPlayerAccountFresh(input.existingAccount.last_refreshed_at, input.nowMs)
  ) {
    return { source: 'cache', player: null }
  }
  const player = await lookupKingshotPlayer(input.playerId, input.kingdomId, input.provider)
  return { source: 'provider', player }
}

export function createProviderRefreshFields(player: NormalizedPlayer) {
  return {
    player_id: player.playerId,
    player_name: player.name,
    kingdom_id: player.kingdomId,
    ...(player.townCenterLevel !== null ? { town_center_level: player.townCenterLevel } : {}),
    ...(player.avatarUrl ? { profile_photo: player.avatarUrl } : {}),
    last_refreshed_at: player.providerFetchedAt,
    updated_at: player.providerFetchedAt,
  }
}

export function createNewLinkedPlayerFields(player: NormalizedPlayer, userId: string) {
  return {
    ...createProviderRefreshFields(player),
    user_id: userId,
    player_level: null,
    town_center_level: player.townCenterLevel,
    level_rendered: null,
    level_rendered_detailed: null,
    level_image: null,
    profile_photo: player.avatarUrl,
    verification_status: 'linked' as const,
    verification_method: 'none' as const,
    verified_by: null,
    verified_at: null,
    is_primary: true,
    is_public: true,
    created_at: player.providerFetchedAt,
  }
}

function safeAccount(value: unknown) {
  const row = record(value)
  if (!row) return null
  return {
    id: row.id,
    player_id: row.player_id,
    player_name: row.player_name,
    kingdom_id: row.kingdom_id,
    player_level: row.player_level,
    town_center_level: row.town_center_level,
    level_rendered: row.level_rendered,
    level_rendered_detailed: row.level_rendered_detailed,
    level_image: row.level_image,
    profile_photo: row.profile_photo,
    verification_status: row.verification_status,
    verification_method: row.verification_method,
    verified_at: row.verified_at,
    last_refreshed_at: row.last_refreshed_at,
    is_primary: row.is_primary,
    is_public: row.is_public,
  }
}

export async function linkOrRevalidatePlayerAccount(
  userId: string,
  input: {
    action: 'link' | 'revalidate'
    playerId?: unknown
    kingdomId?: unknown
    forceProviderRefresh?: boolean
  },
  dependencies: { provider?: PlayerProvider; nowMs?: number } = {},
) {
  const admin = getSupabaseAdmin()
  const { data: existingValue, error: existingError } = await admin
    .from('player_accounts')
    .select(ACCOUNT_FIELDS)
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle()
  if (existingError) throw existingError

  const existing = record(existingValue)
  if (input.action === 'revalidate' && !existing) return null

  const requestedPlayerId = input.action === 'revalidate'
    ? validatePlayerId(existing?.player_id)
    : validatePlayerId(input.playerId)
  const requestedKingdomId = input.action === 'revalidate'
    ? validateKingdomId(existing?.kingdom_id)
    : validateKingdomId(input.kingdomId)
  if (existing && existing.player_id !== requestedPlayerId) {
    throw new LinkedPlayerServiceError(
      409,
      'A different primary Kingshot player is already linked.',
      'PLAYER_ACCOUNT_CONFLICT',
    )
  }

  const resolution = await resolvePlayerRefresh({
    action: input.action,
    existingAccount: existing,
    playerId: requestedPlayerId,
    kingdomId: requestedKingdomId,
    forceProviderRefresh: input.forceProviderRefresh,
    provider: dependencies.provider ?? createMightPulsePlayerProvider(),
    nowMs: dependencies.nowMs,
  })
  if (resolution.source === 'cache') return safeAccount(existing)

  const result = existing
    ? await admin.from('player_accounts').update({
        ...createProviderRefreshFields(resolution.player),
        is_public: existing.is_public,
        is_primary: true,
      }).eq('id', existing.id).eq('user_id', userId).select(ACCOUNT_FIELDS).single()
    : await admin.from('player_accounts').insert(
        createNewLinkedPlayerFields(resolution.player, userId),
      ).select(ACCOUNT_FIELDS).single()
  const { data, error } = result
  if (error) {
    if (error.code === '23505') {
      throw new LinkedPlayerServiceError(
        409,
        'This Kingshot player is already linked to another Forge account.',
        'PLAYER_ALREADY_LINKED',
      )
    }
    throw error
  }
  return safeAccount(data)
}
