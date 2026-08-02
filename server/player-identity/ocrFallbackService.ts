import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { createSupabaseVisionEvidenceStorageService } from '../vision/evidence/supabaseVisionEvidenceRuntime.js'
import type { VisionEvidenceActor } from '../../shared/platform/vision/evidenceStorageContracts.js'
import { normalizeAllianceTag } from '../../shared/domains/player-identity/accountLinkingOcr.js'
import { LinkedPlayerServiceError, validatePlayerId } from './linkedPlayerService.js'
import { extractAccountLinkCandidates } from './accountLinkingOcrService.js'

export type OcrFallbackInput = {
  evidenceId: string
  playerId: unknown
  displayName: unknown
  kingdom: unknown
  allianceTag?: unknown
  townCenterLevel?: unknown
  corrections?: Readonly<Record<string, boolean>>
  userConfirmed?: Readonly<Record<string, boolean>>
}

const ACCOUNT_FIELDS = 'id,user_id,player_id,player_name,kingdom_id,player_level,town_center_level,level_rendered,level_rendered_detailed,level_image,profile_photo,verification_status,verification_method,verified_by,verified_at,last_refreshed_at,is_primary,is_public,created_at,updated_at'
const RESUBMITTABLE_STATUSES = new Set(['linked', 'rejected'])

function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new LinkedPlayerServiceError(422, `${label} is invalid.`)
  return value.trim()
}

function boundedInteger(value: unknown, label: string, min: number, max: number): number {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(number) || number < min || number > max) throw new LinkedPlayerServiceError(422, `${label} is invalid.`)
  return number
}

function confirmationMap(input: OcrFallbackInput) {
  const source = input.corrections && typeof input.corrections === 'object'
    ? input.corrections
    : input.userConfirmed && typeof input.userConfirmed === 'object'
      ? input.userConfirmed
      : {}
  return Object.fromEntries(
    Object.entries(source).filter(([key, value]) =>
      ['playerId', 'displayName', 'kingdom', 'allianceTag', 'townCenterLevel'].includes(key) && typeof value === 'boolean',
    ),
  )
}

function restorePayload(value: Record<string, unknown>) {
  return {
    player_id: value.player_id,
    player_name: value.player_name,
    kingdom_id: value.kingdom_id,
    player_level: value.player_level,
    town_center_level: value.town_center_level,
    level_rendered: value.level_rendered,
    level_rendered_detailed: value.level_rendered_detailed,
    level_image: value.level_image,
    profile_photo: value.profile_photo,
    verification_status: value.verification_status,
    verification_method: value.verification_method,
    verified_by: value.verified_by,
    verified_at: value.verified_at,
    last_refreshed_at: value.last_refreshed_at,
    is_primary: value.is_primary,
    is_public: value.is_public,
    updated_at: value.updated_at,
  }
}

export async function saveOcrFallbackAccount(userId: string, input: OcrFallbackInput) {
  const evidenceId = text(input.evidenceId, 'Evidence', 80)
  const corrections = confirmationMap(input)
  if (corrections.townCenterLevel !== true) throw new LinkedPlayerServiceError(422, 'Town Centre Level requires explicit manual confirmation.')

  const evidence = createSupabaseVisionEvidenceStorageService()
  const actor: VisionEvidenceActor = { userId, accountStatus: 'active', permissions: [] }
  const stored = await evidence.readEvidenceBytes(actor, evidenceId)
  const ocr = await extractAccountLinkCandidates({
    evidenceId,
    bytes: stored.bytes,
    sha256: stored.metadata.sha256,
    mimeType: stored.metadata.mimeType,
    widthPx: stored.metadata.widthPx,
    heightPx: stored.metadata.heightPx,
  })

  const ocrPlayerId = ocr.candidates.find((candidate) => candidate.field === 'playerId')?.value
  const ocrKingdom = ocr.candidates.find((candidate) => candidate.field === 'kingdom')?.value
  if (!ocrPlayerId || !ocrKingdom) throw new LinkedPlayerServiceError(422, 'The stored screenshot does not contain the required OCR identity fields.')

  const playerId = validatePlayerId(input.playerId)
  if (corrections.playerId !== true && playerId !== ocrPlayerId) throw new LinkedPlayerServiceError(409, 'Player ID does not match the server OCR result.')
  const playerName = text(input.displayName, 'Display name', 80)
  const kingdomId = boundedInteger(input.kingdom, 'Kingdom', 1, 9999)
  if (corrections.kingdom !== true && String(kingdomId) !== ocrKingdom) throw new LinkedPlayerServiceError(409, 'Kingdom does not match the server OCR result.')
  const townCenterLevel = boundedInteger(input.townCenterLevel, 'Town Centre level', 1, 30)
  const alliance = normalizeAllianceTag(typeof input.allianceTag === 'string' ? input.allianceTag : '')

  const admin = getSupabaseAdmin()
  const existingResult = await admin
    .from('player_accounts')
    .select(ACCOUNT_FIELDS)
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle()
  if (existingResult.error) throw existingResult.error

  const existing = existingResult.data as Record<string, unknown> | null
  if (existing && existing.player_id !== playerId) throw new LinkedPlayerServiceError(409, 'A different primary Kingshot player is already linked.')
  if (existing && Number(existing.kingdom_id) !== kingdomId) throw new LinkedPlayerServiceError(409, 'The screenshot State does not match the existing player claim.')
  const existingStatus = typeof existing?.verification_status === 'string' ? existing.verification_status : ''
  if (existing && !RESUBMITTABLE_STATUSES.has(existingStatus)) {
    throw new LinkedPlayerServiceError(409, existingStatus === 'pending'
      ? 'A player verification request is already waiting for review.'
      : 'This player claim already has a protected verification state and cannot be replaced by a screenshot request.')
  }

  const now = new Date().toISOString()
  const payload = {
    user_id: userId,
    player_id: playerId,
    player_name: playerName,
    kingdom_id: kingdomId,
    player_level: null,
    town_center_level: townCenterLevel,
    level_rendered: null,
    level_rendered_detailed: null,
    level_image: null,
    profile_photo: null,
    verification_status: 'pending' as const,
    verification_method: 'none' as const,
    verified_by: null,
    verified_at: null,
    last_refreshed_at: now,
    is_primary: true,
    is_public: existing?.is_public === true,
    updated_at: now,
  }

  const query = existing
    ? admin.from('player_accounts').update(payload).eq('id', existing.id).eq('user_id', userId)
    : admin.from('player_accounts').insert({ ...payload, created_at: now })
  const saved = await query.select(ACCOUNT_FIELDS).single()
  if (saved.error) {
    if (saved.error.code === '23505') throw new LinkedPlayerServiceError(409, 'This Kingshot player is already claimed by another Forge account.')
    throw saved.error
  }

  const savedData = saved.data as Record<string, unknown>
  const accountId = String(savedData.id)
  const previousStatus = existing?.verification_status ?? null

  async function rollbackAccount() {
    if (existing) {
      await admin.from('player_accounts').update(restorePayload(existing)).eq('id', existing.id).eq('user_id', userId)
    } else {
      await admin.from('player_accounts').delete().eq('id', accountId).eq('user_id', userId)
    }
  }

  const event = await admin
    .from('player_verification_events')
    .insert({
      player_account_id: accountId,
      requested_by: userId,
      reviewed_by: null,
      previous_status: previousStatus,
      new_status: 'pending',
      method: 'none',
      notes: `Forge Vision evidence submitted for review. Evidence ID: ${evidenceId}`,
    })
    .select('id')
    .single()

  if (event.error) {
    await rollbackAccount()
    throw event.error
  }

  const audit = await admin.from('vision_audit_events').insert({
    actor_id: userId,
    event_type: 'vision.player.verification_requested',
    entity_type: 'player_account',
    entity_id: accountId,
    payload: {
      evidenceId,
      playerIdLast4: playerId.slice(-4),
      kingdom: kingdomId,
      townCenterLevel,
      allianceTagPresent: Boolean(alliance.value),
      corrections,
      verifiedOwnership: false,
      source: 'server_recomputed_ocr_plus_user_review',
      reviewState: 'pending',
    },
  })

  if (audit.error) {
    await admin.from('player_verification_events').delete().eq('id', event.data.id)
    await rollbackAccount()
    throw audit.error
  }

  return saved.data
}
