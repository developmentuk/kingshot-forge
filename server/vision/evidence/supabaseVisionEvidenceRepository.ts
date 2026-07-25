import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../../database/supabaseAdmin.js'
import {
  VISION_EVIDENCE_BUCKET,
  VISION_ACCEPTANCE_RECOVERY_UPLOAD_PURPOSE,
  type VisionActiveAcceptanceEvidence,
  type VisionEvidenceMetadata,
  type VisionEvidencePurpose,
  type VisionEvidenceRepository,
  type VisionEvidenceUploadIntent,
} from '../../../shared/platform/vision/evidenceStorageContracts.js'
import { isUuid, isVisionEvidenceMimeType, isVisionEvidencePath, assertVisionEvidenceDimensions, assertVisionEvidenceHash } from '../../../shared/platform/vision/evidenceStorageContracts.js'

const EVIDENCE_COLUMNS = 'id,upload_intent_id,owner_user_id,purpose,storage_bucket,storage_path,byte_length,sha256,width_px,height_px,mime_type,upload_purpose,consent_recorded_at,retention_until,deletion_requested_at,deleted_at,legal_hold,verified_at'
const INTENT_COLUMNS = 'id,owner_user_id,purpose,upload_purpose,storage_bucket,storage_path,expected_mime_type,expected_bytes,consent_recorded_at,expires_at,status'
const ACTIVE_ACCEPTANCE_COLUMNS = 'id,verified_at,mime_type,byte_length'

type UploadIntentRow = Record<string, unknown>
type EvidenceRow = Record<string, unknown>

export interface SupabaseVisionEvidenceRepositoryOptions { client?: SupabaseClient }

export class SupabaseVisionEvidenceRepository implements VisionEvidenceRepository {
  readonly #client: SupabaseClient
  constructor(options: SupabaseVisionEvidenceRepositoryOptions = {}) { this.#client = options.client ?? getSupabaseAdmin() }

  async createUploadIntent(intent: VisionEvidenceUploadIntent): Promise<void> {
    const { error } = await this.#client.from('vision_evidence_upload_intents').insert({ id: intent.id, owner_user_id: intent.ownerUserId, purpose: intent.purpose, upload_purpose: intent.uploadPurpose, storage_bucket: intent.storageBucket, storage_path: intent.storagePath, expected_mime_type: intent.expectedMimeType, expected_bytes: intent.expectedBytes, consent_recorded_at: intent.consentRecordedAt, expires_at: intent.expiresAt, status: intent.status })
    if (error) throw new Error(`Unable to create Vision evidence upload intent: ${error.message}`)
  }

  async getUploadIntent(id: string): Promise<VisionEvidenceUploadIntent | null> {
    assertId(id)
    const { data, error } = await this.#client.from('vision_evidence_upload_intents').select(INTENT_COLUMNS).eq('id', id).maybeSingle()
    if (error) throw new Error(`Unable to load Vision evidence upload intent: ${error.message}`)
    return data === null ? null : mapUploadIntent(data as UploadIntentRow)
  }

  async markUploadCompleted(id: string): Promise<void> {
    assertId(id)
    const { data, error } = await this.#client.from('vision_evidence_upload_intents').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id).select('id').single()
    if (error || !data) throw new Error(error?.message ?? 'Vision evidence upload intent completion was not confirmed.')
  }

  async markUploadAbandoned(id: string, abandonedAt: string): Promise<void> {
    assertId(id)
    const { data, error } = await this.#client.from('vision_evidence_upload_intents').update({ status: 'abandoned', abandoned_at: abandonedAt }).eq('id', id).select('id').single()
    if (error || !data) throw new Error(error?.message ?? 'Vision evidence upload intent abandonment was not confirmed.')
  }

  async createVerifiedEvidence(metadata: VisionEvidenceMetadata): Promise<void> {
    const { error } = await this.#client.from('vision_evidence_images').insert({ id: metadata.id, upload_intent_id: metadata.uploadIntentId, owner_user_id: metadata.ownerUserId, purpose: metadata.purpose, storage_bucket: metadata.bucket, storage_path: metadata.path, byte_length: metadata.bytes, sha256: metadata.sha256, width_px: metadata.widthPx, height_px: metadata.heightPx, mime_type: metadata.mimeType, upload_purpose: metadata.uploadPurpose, consent_recorded_at: metadata.consentRecordedAt, uploaded_by: metadata.ownerUserId, retention_until: metadata.retentionUntil, legal_hold: metadata.legalHold, verified_at: metadata.verifiedAt })
    if (error) throw new Error(`Unable to create verified Vision evidence metadata: ${error.message}`)
  }

  async getEvidence(id: string): Promise<VisionEvidenceMetadata | null> {
    assertId(id)
    const { data, error } = await this.#client.from('vision_evidence_images').select(EVIDENCE_COLUMNS).eq('id', id).maybeSingle()
    if (error) throw new Error(`Unable to load Vision evidence metadata: ${error.message}`)
    return data === null ? null : mapEvidence(data as EvidenceRow)
  }

  async listActiveAcceptanceEvidenceForOwner(ownerUserId: string, limit: number): Promise<readonly VisionActiveAcceptanceEvidence[]> {
    assertId(ownerUserId)
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 5) throw new Error('Vision acceptance evidence query limit is invalid.')
    const { data, error } = await this.#client.from('vision_evidence_images').select(ACTIVE_ACCEPTANCE_COLUMNS).eq('owner_user_id', ownerUserId).eq('purpose', 'scan_source').eq('upload_purpose', VISION_ACCEPTANCE_RECOVERY_UPLOAD_PURPOSE).is('deleted_at', null).eq('legal_hold', false).order('verified_at', { ascending: false }).limit(limit)
    if (error) throw new Error(`Unable to list active Vision acceptance evidence: ${error.message}`)
    return (data ?? []).map((row) => mapActiveAcceptanceEvidence(row as Record<string, unknown>))
  }

  async findActiveBySha256(sha256: string): Promise<VisionEvidenceMetadata | null> {
    assertVisionEvidenceHash(sha256)
    const { data, error } = await this.#client.from('vision_evidence_images').select(EVIDENCE_COLUMNS).eq('sha256', sha256).is('deleted_at', null).maybeSingle()
    if (error) throw new Error(`Unable to check duplicate Vision evidence: ${error.message}`)
    return data === null ? null : mapEvidence(data as EvidenceRow)
  }

  async requestDeletion(id: string, requestedAt: string, reason: string): Promise<void> {
    assertId(id)
    if (!reason.trim() || reason.length > 240) throw new Error('Vision evidence deletion reason is invalid.')
    const { data, error } = await this.#client.from('vision_evidence_images').update({ deletion_requested_at: requestedAt, deletion_reason: reason.trim() }).eq('id', id).select('id').single()
    if (error || !data) throw new Error(error?.message ?? 'Vision evidence deletion request was not confirmed.')
  }

  async markDeleted(id: string, deletedAt: string): Promise<void> {
    assertId(id)
    const { data, error } = await this.#client.from('vision_evidence_images').update({ deleted_at: deletedAt }).eq('id', id).select('id').single()
    if (error || !data) throw new Error(error?.message ?? 'Vision evidence deletion was not confirmed.')
  }

  async recordAudit(input: { eventType: string; entityId: string; actorId: string | null; payload: Record<string, unknown> }): Promise<void> {
    assertId(input.entityId)
    if (!/^vision\.[a-z0-9_.-]+$/.test(input.eventType)) throw new Error('Vision evidence audit event type is invalid.')
    const { error } = await this.#client.from('vision_audit_events').insert({ actor_id: input.actorId, event_type: input.eventType, entity_type: 'vision_evidence', entity_id: input.entityId, payload: input.payload })
    if (error) throw new Error(`Unable to record Vision evidence audit event: ${error.message}`)
  }
}

function assertId(id: string): void { if (!isUuid(id)) throw new Error('Vision evidence identifiers must be UUIDs.') }
function mapUploadIntent(row: UploadIntentRow): VisionEvidenceUploadIntent {
  const intent = { id: text(row.id), ownerUserId: text(row.owner_user_id), purpose: row.purpose as VisionEvidencePurpose, uploadPurpose: text(row.upload_purpose), storageBucket: row.storage_bucket, storagePath: text(row.storage_path), expectedMimeType: row.expected_mime_type, expectedBytes: row.expected_bytes, expiresAt: text(row.expires_at), consentRecordedAt: nullableText(row.consent_recorded_at), status: row.status } as VisionEvidenceUploadIntent
  if (!isUuid(intent.id) || !isUuid(intent.ownerUserId) || !isPurpose(intent.purpose) || intent.storageBucket !== VISION_EVIDENCE_BUCKET || !isVisionEvidencePath(intent.storagePath) || !isVisionEvidenceMimeType(String(intent.expectedMimeType)) || !Number.isSafeInteger(intent.expectedBytes) || intent.expectedBytes < 1 || !isTimestamp(intent.expiresAt) || !['created', 'completed', 'abandoned', 'expired'].includes(intent.status)) throw new Error('Supabase returned malformed Vision evidence upload intent data.')
  return { ...intent, expectedMimeType: intent.expectedMimeType as VisionEvidenceUploadIntent['expectedMimeType'] }
}
function mapEvidence(row: EvidenceRow): VisionEvidenceMetadata {
  const evidence = { id: text(row.id), uploadIntentId: text(row.upload_intent_id), ownerUserId: nullableText(row.owner_user_id), purpose: row.purpose as VisionEvidencePurpose, bucket: text(row.storage_bucket), path: text(row.storage_path), bytes: row.byte_length, mimeType: row.mime_type, sha256: text(row.sha256), widthPx: row.width_px, heightPx: row.height_px, uploadPurpose: text(row.upload_purpose), consentRecordedAt: nullableText(row.consent_recorded_at), retentionUntil: text(row.retention_until), deletionRequestedAt: nullableText(row.deletion_requested_at), deletedAt: nullableText(row.deleted_at), legalHold: row.legal_hold, verifiedAt: text(row.verified_at) } as VisionEvidenceMetadata
  if (!isUuid(evidence.id) || !isUuid(evidence.uploadIntentId) || (evidence.ownerUserId !== null && !isUuid(evidence.ownerUserId)) || (evidence.purpose === 'scan_source' && evidence.ownerUserId === null) || !isPurpose(evidence.purpose) || evidence.bucket !== VISION_EVIDENCE_BUCKET || !isVisionEvidencePath(evidence.path) || (evidence.ownerUserId !== null && !evidence.path.startsWith(`${evidence.ownerUserId}/${evidence.purpose}/`)) || !isVisionEvidenceMimeType(String(evidence.mimeType)) || !Number.isSafeInteger(evidence.bytes) || evidence.bytes < 1 || evidence.bytes > 16777216 || !Number.isSafeInteger(evidence.widthPx) || !Number.isSafeInteger(evidence.heightPx) || typeof evidence.legalHold !== 'boolean') throw new Error('Supabase returned malformed Vision evidence metadata.')
  assertVisionEvidenceHash(evidence.sha256); assertVisionEvidenceDimensions(evidence.widthPx, evidence.heightPx)
  if (!isTimestamp(evidence.retentionUntil) || !isTimestamp(evidence.verifiedAt) || (evidence.deletionRequestedAt && !isTimestamp(evidence.deletionRequestedAt)) || (evidence.deletedAt && !isTimestamp(evidence.deletedAt))) throw new Error('Supabase returned malformed Vision evidence timestamps.')
  return { ...evidence, mimeType: evidence.mimeType as VisionEvidenceMetadata['mimeType'] }
}
function mapActiveAcceptanceEvidence(row: Record<string, unknown>): VisionActiveAcceptanceEvidence {
  const evidenceId = text(row.id); const uploadedAt = text(row.verified_at); const mimeType = String(row.mime_type); const byteLength = typeof row.byte_length === 'number' ? row.byte_length : NaN
  if (!isUuid(evidenceId) || !isTimestamp(uploadedAt) || !isVisionEvidenceMimeType(mimeType) || !Number.isSafeInteger(byteLength) || byteLength < 1 || byteLength > 16777216) throw new Error('Supabase returned malformed active Vision acceptance evidence.')
  return { evidenceId, uploadedAt, mimeType: mimeType as VisionActiveAcceptanceEvidence['mimeType'], byteLength, status: 'active' }
}
function text(value: unknown): string { if (typeof value !== 'string' || !value) throw new Error('Supabase returned a malformed Vision evidence field.'); return value }
function nullableText(value: unknown): string | null { if (value === null || value === undefined) return null; return text(value) }
function isPurpose(value: unknown): value is VisionEvidencePurpose { return value === 'mapping_reference' || value === 'test_case' || value === 'scan_source' || value === 'evidence_crop' }
function isTimestamp(value: string): boolean { return Number.isFinite(new Date(value).getTime()) }

export function createSupabaseVisionEvidenceRepository(options: SupabaseVisionEvidenceRepositoryOptions = {}): VisionEvidenceRepository { return new SupabaseVisionEvidenceRepository(options) }
