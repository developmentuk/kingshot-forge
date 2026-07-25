import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { createSupabaseVisionEvidenceStorageService } from '../vision/evidence/supabaseVisionEvidenceRuntime.js'
import type { VisionEvidenceActor } from '../../shared/platform/vision/evidenceStorageContracts.js'
import { normalizeAllianceTag } from '../../shared/domains/player-identity/accountLinkingOcr.js'
import { LinkedPlayerServiceError, validatePlayerId } from './linkedPlayerService.js'

export type OcrFallbackInput = {
  evidenceId: string
  playerId: unknown
  displayName: unknown
  kingdom: unknown
  allianceTag?: unknown
  townCenterLevel?: unknown
  corrections?: Readonly<Record<string, boolean>>
}

function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new LinkedPlayerServiceError(422, `${label} is invalid.`)
  return value.trim()
}

function boundedInteger(value: unknown, label: string, min: number, max: number): number {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(number) || number < min || number > max) throw new LinkedPlayerServiceError(422, `${label} is invalid.`)
  return number
}

export async function saveOcrFallbackAccount(userId: string, input: OcrFallbackInput) {
  const playerId = validatePlayerId(input.playerId)
  const playerName = text(input.displayName, 'Display name', 80)
  const kingdomId = boundedInteger(input.kingdom, 'Kingdom', 1, 9999)
  const townCenterLevel = boundedInteger(input.townCenterLevel, 'Town Centre level', 1, 30)
  const alliance = normalizeAllianceTag(typeof input.allianceTag === 'string' ? input.allianceTag : '')
  const evidence = createSupabaseVisionEvidenceStorageService()
  const actor: VisionEvidenceActor = { userId, accountStatus: 'active', permissions: [] }
  await evidence.getEvidenceMetadata(actor, text(input.evidenceId, 'Evidence', 80))
  const admin = getSupabaseAdmin()
  const existingResult = await admin.from('player_accounts').select('id,player_id,is_primary,is_public').eq('user_id', userId).eq('is_primary', true).maybeSingle()
  if (existingResult.error) throw existingResult.error
  if (existingResult.data && existingResult.data.player_id !== playerId) throw new LinkedPlayerServiceError(409, 'A different primary Kingshot player is already linked.')
  const now = new Date().toISOString()
  const payload = {
    user_id: userId, player_id: playerId, player_name: playerName, kingdom_id: kingdomId,
    player_level: null, town_center_level: townCenterLevel, level_rendered: null, level_rendered_detailed: null,
    level_image: null, profile_photo: null, verification_status: 'linked', verification_method: 'none',
    verified_by: null, verified_at: null, last_refreshed_at: now, is_primary: true,
    is_public: existingResult.data?.is_public ?? true, updated_at: now,
  }
  const query = existingResult.data
    ? admin.from('player_accounts').update(payload).eq('id', existingResult.data.id).eq('user_id', userId)
    : admin.from('player_accounts').insert(payload)
  const saved = await query.select('id,player_id,player_name,kingdom_id,town_center_level,verification_status,verification_method,is_primary,is_public,updated_at').single()
  if (saved.error) throw saved.error
  const corrections = input.corrections && typeof input.corrections === 'object' ? Object.fromEntries(Object.entries(input.corrections).filter(([key, value]) => ['playerId', 'displayName', 'kingdom', 'allianceTag', 'townCenterLevel'].includes(key) && typeof value === 'boolean')) : {}
  const audit = await admin.from('vision_audit_events').insert({ actor_id: userId, event_type: 'vision.player.ocr_fallback_saved', entity_type: 'player_account', entity_id: input.evidenceId, payload: { evidenceId: input.evidenceId, playerId, kingdom: kingdomId, townCenterLevel, allianceTagPresent: Boolean(alliance.value), corrections, verifiedOwnership: false } })
  if (audit.error) throw audit.error
  await evidence.cancelOwnerScanEvidence(actor, input.evidenceId, 'Account-linking OCR fallback review completed; exact evidence removed.')
  return saved.data
}
