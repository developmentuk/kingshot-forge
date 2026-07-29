import type { KingshotPlayer } from '../../src/types/player.js'
import { getSupabaseAdmin } from '../database/supabaseAdmin.js'

const ACCOUNT_FIELDS = 'id,user_id,player_id,player_name,kingdom_id,player_level,town_center_level,level_rendered,level_rendered_detailed,level_image,profile_photo,verification_status,verification_method,verified_by,verified_at,last_refreshed_at,is_primary,is_public,created_at,updated_at'

type LookupRecord = Readonly<Record<string, unknown>>

export class LinkedPlayerServiceError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'LinkedPlayerServiceError'
    this.statusCode = statusCode
  }
}

export function validatePlayerId(value: unknown): string {
  const playerId = typeof value === 'string' ? value.trim().replace(/\s+/gu, '') : ''
  if (!/^\d{1,20}$/u.test(playerId)) {
    throw new LinkedPlayerServiceError(422, 'Enter a valid Kingshot Player ID.')
  }
  return playerId
}

export function validateKingdomId(value: unknown): number {
  const kingdomId = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isInteger(kingdomId) || kingdomId < 1 || kingdomId > 9999) {
    throw new LinkedPlayerServiceError(422, 'Enter a valid Kingshot State between 1 and 9999.')
  }
  return kingdomId
}

function record(value: unknown): LookupRecord | null {
  return value && typeof value === 'object' ? value as LookupRecord : null
}

export function normalizeKingshotLookup(value: unknown, requestedPlayerId: string, requestedKingdomId?: number): KingshotPlayer {
  const response = record(value)
  const data = record(response?.data)
  const returnedPlayerId = typeof data?.playerId === 'string'
    ? data.playerId.trim()
    : typeof data?.playerId === 'number' && Number.isSafeInteger(data.playerId)
      ? String(data.playerId)
      : ''
  const name = typeof data?.name === 'string' ? data.name.trim() : ''
  const kingdom = typeof data?.kingdom === 'number' ? data.kingdom : Number(data?.kingdom)
  const level = typeof data?.level === 'number' ? data.level : Number(data?.level)

  if (response?.status !== 'success' || returnedPlayerId !== requestedPlayerId || !name || !Number.isInteger(kingdom) || kingdom < 1 || kingdom > 9999 || !Number.isFinite(level)) {
    throw new LinkedPlayerServiceError(502, 'The Kingshot player service returned an invalid player record.')
  }
  if (requestedKingdomId !== undefined && kingdom !== requestedKingdomId) {
    throw new LinkedPlayerServiceError(409, `This Player ID belongs to State ${kingdom}, not State ${requestedKingdomId}.`)
  }

  return {
    playerId: returnedPlayerId,
    name,
    kingdom,
    level,
    levelRendered: typeof data?.levelRendered === 'string' ? data.levelRendered : '',
    levelRenderedDetailed: typeof data?.levelRenderedDetailed === 'string' ? data.levelRenderedDetailed : '',
    levelImage: typeof data?.levelImage === 'string' ? data.levelImage : null,
    profilePhoto: typeof data?.profilePhoto === 'string' ? data.profilePhoto : null,
  }
}

export function createVerifiedPlayerFields(player: KingshotPlayer, userId: string, verifiedAt = new Date().toISOString()) {
  return {
    player_id: player.playerId,
    player_name: player.name,
    kingdom_id: player.kingdom,
    player_level: player.level,
    level_rendered: player.levelRendered || null,
    level_rendered_detailed: player.levelRenderedDetailed || null,
    level_image: player.levelImage,
    profile_photo: player.profilePhoto,
    verification_status: 'verified' as const,
    verification_method: 'kingshot_player_lookup' as const,
    verified_by: userId,
    verified_at: verifiedAt,
    last_refreshed_at: verifiedAt,
    updated_at: verifiedAt,
  }
}

export async function lookupKingshotPlayer(playerIdInput: unknown, kingdomIdInput: unknown): Promise<KingshotPlayer> {
  const playerId = validatePlayerId(playerIdInput)
  const kingdomId = validateKingdomId(kingdomIdInput)
  const baseUrl = process.env.SUPABASE_URL?.trim() ?? process.env.VITE_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? process.env.SUPABASE_SECRET_KEY?.trim() ?? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!baseUrl || !key) throw new LinkedPlayerServiceError(503, 'The Kingshot player service is not configured.')

  const url = new URL(`${baseUrl.replace(/\/$/u, '')}/functions/v1/kingshot-player`)
  url.searchParams.set('playerId', playerId)
  url.searchParams.set('kingdomId', String(kingdomId))
  let response: Response
  try {
    response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) })
  } catch {
    throw new LinkedPlayerServiceError(502, 'The Kingshot player service could not be reached.')
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const safePayload = record(payload)
    const message = typeof safePayload?.message === 'string' ? safePayload.message : ''
    throw new LinkedPlayerServiceError(response.status === 409 ? 409 : 502, message || 'The Kingshot player service could not validate this Player ID and State.')
  }
  return normalizeKingshotLookup(payload, playerId, kingdomId)
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

export async function linkOrRevalidatePlayerAccount(userId: string, input: { action: 'link' | 'revalidate'; playerId?: unknown; kingdomId?: unknown }) {
  const admin = getSupabaseAdmin()
  const { data: existing, error: existingError } = await admin.from('player_accounts').select('id,player_id,kingdom_id,is_primary,is_public').eq('user_id', userId).eq('is_primary', true).maybeSingle()
  if (existingError) throw existingError

  if (input.action === 'revalidate' && !existing) throw new LinkedPlayerServiceError(404, 'No linked Kingshot player requires revalidation.')

  const requestedPlayerId = input.action === 'revalidate'
    ? validatePlayerId(existing?.player_id)
    : validatePlayerId(input.playerId)
  const requestedKingdomId = input.action === 'revalidate'
    ? validateKingdomId(existing?.kingdom_id)
    : validateKingdomId(input.kingdomId)
  if (existing && existing.player_id !== requestedPlayerId) throw new LinkedPlayerServiceError(409, 'A different primary Kingshot player is already linked.')

  const player = await lookupKingshotPlayer(requestedPlayerId, requestedKingdomId)
  const verifiedFields = createVerifiedPlayerFields(player, userId)
  const payload = existing
    ? { ...verifiedFields, is_public: existing.is_public, is_primary: true }
    : { ...verifiedFields, user_id: userId, is_primary: true, is_public: true }

  const query = existing
    ? admin.from('player_accounts').update(payload).eq('id', existing.id).eq('user_id', userId)
    : admin.from('player_accounts').insert(payload)
  const { data, error } = await query.select(ACCOUNT_FIELDS).single()
  if (error) {
    if (error.code === '23505') throw new LinkedPlayerServiceError(409, 'This Kingshot player is already linked to another Forge account.')
    throw error
  }
  return safeAccount(data)
}
