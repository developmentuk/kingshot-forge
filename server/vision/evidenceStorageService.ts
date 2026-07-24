import { randomUUID } from 'node:crypto'
import {
  VISION_EVIDENCE_BUCKET,
  VISION_EVIDENCE_INTENT_SECONDS,
  VISION_EVIDENCE_MAX_BYTES,
  VISION_EVIDENCE_RETENTION_POLICIES,
  VISION_EVIDENCE_SIGNED_URL_MAX_SECONDS,
  type CompleteVisionEvidenceInput,
  type CreateVisionEvidenceIntentInput,
  type VisionEvidenceActor,
  type VisionEvidenceMetadata,
  type VisionEvidencePurpose,
  type VisionEvidenceReadUrl,
  type VisionEvidenceRepository,
  type VisionEvidenceUploadIntent,
  type VisionEvidenceUploadProvider,
  type VisionEvidenceUploadUrl,
  assertVisionEvidenceDimensions,
  assertVisionEvidenceHash,
  VisionEvidenceValidationError,
  extensionForVisionEvidenceMimeType,
  isUuid,
  isVisionEvidenceMimeType,
  isVisionEvidencePath,
} from '../../shared/platform/vision/evidenceStorageContracts.js'
import { VisionImageMetadataError } from '../../shared/platform/vision/imageMetadata.js'

export class VisionEvidenceStorageError extends Error {
  readonly code: string
  constructor(code: string, message: string) { super(message); this.name = 'VisionEvidenceStorageError'; this.code = code }
}

export interface VisionEvidenceStorageServiceOptions {
  repository: VisionEvidenceRepository
  provider: VisionEvidenceUploadProvider
  now?: () => Date
  createId?: () => string
}

function activeActor(actor: VisionEvidenceActor): void {
  if (actor.accountStatus !== 'active' || !actor.userId || !isUuid(actor.userId)) throw new VisionEvidenceStorageError('unauthorised', 'An active authenticated Vision actor is required.')
}

function canReview(actor: VisionEvidenceActor): boolean {
  return actor.permissions.includes('vision.evidence.review') || actor.permissions.includes('vision.admin.read')
}

function canManage(actor: VisionEvidenceActor, ownerUserId: string | null): boolean {
  activeActor(actor)
  return actor.userId === ownerUserId || canReview(actor)
}

function dateFrom(value: string, code: string): Date {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new VisionEvidenceStorageError(code, 'Vision evidence received an invalid timestamp.')
  return date
}

function retentionUntil(input: CreateVisionEvidenceIntentInput, purpose: VisionEvidencePurpose, now: Date, isReviewer: boolean): string {
  const policy = VISION_EVIDENCE_RETENTION_POLICIES[purpose]
  const requested = input.retentionUntil ? dateFrom(input.retentionUntil, 'invalid_retention') : new Date(now.getTime() + policy.defaultDays * 86400000)
  const maximum = new Date(now.getTime() + policy.maximumDays * 86400000)
  if (requested <= now || requested > maximum) throw new VisionEvidenceStorageError('invalid_retention', 'Vision evidence retention must be in the future and within the governed maximum.')
  if (!isReviewer && requested.getTime() > now.getTime() + policy.defaultDays * 86400000) throw new VisionEvidenceStorageError('retention_extension_denied', 'Only an authorised reviewer may extend Vision evidence retention.')
  return requested.toISOString()
}

function assertPurposeAndUpload(purpose: VisionEvidencePurpose, uploadPurpose: string, consentRecordedAt: string | null | undefined): void {
  if (!uploadPurpose.trim() || uploadPurpose.length > 240) throw new VisionEvidenceStorageError('invalid_purpose', 'Vision evidence requires a bounded upload purpose.')
  if (purpose === 'scan_source' && !consentRecordedAt) throw new VisionEvidenceStorageError('consent_required', 'Scan-source evidence requires recorded purpose consent.')
  if (consentRecordedAt) dateFrom(consentRecordedAt, 'invalid_consent')
}

function mapExpectedValidation(error: unknown): never {
  if (error instanceof VisionEvidenceValidationError) throw new VisionEvidenceStorageError(error.code, error.message)
  if (error instanceof VisionImageMetadataError) throw new VisionEvidenceStorageError(error.code === 'pixel_limit_exceeded' ? 'excessive_pixels' : 'invalid_image', error.message)
  throw error
}

export class VisionEvidenceStorageService {
  private readonly now: () => Date
  private readonly createId: () => string
  constructor(private readonly options: VisionEvidenceStorageServiceOptions) {
    this.now = options.now ?? (() => new Date())
    this.createId = options.createId ?? randomUUID
  }

  async createUploadIntent(actor: VisionEvidenceActor, input: CreateVisionEvidenceIntentInput): Promise<{ intent: VisionEvidenceUploadIntent; upload: VisionEvidenceUploadUrl }> {
    activeActor(actor)
    if (!isUuid(input.ownerUserId) || actor.userId !== input.ownerUserId) throw new VisionEvidenceStorageError('owner_mismatch', 'Evidence upload ownership must match the authenticated actor.')
    if (!isVisionEvidenceMimeType(input.mimeType)) throw new VisionEvidenceStorageError('unsupported_mime_type', 'Vision evidence MIME type is not allowlisted.')
    if (!Number.isInteger(input.expectedBytes) || input.expectedBytes <= 0 || input.expectedBytes > VISION_EVIDENCE_MAX_BYTES) throw new VisionEvidenceStorageError('file_too_large', 'Vision evidence exceeds the governed size limit.')
    assertPurposeAndUpload(input.purpose, input.uploadPurpose, input.consentRecordedAt)
    const now = this.now()
    const id = this.createId()
    const expiresAt = new Date(now.getTime() + VISION_EVIDENCE_INTENT_SECONDS * 1000).toISOString()
    const intent: VisionEvidenceUploadIntent = { id, ownerUserId: input.ownerUserId, purpose: input.purpose, uploadPurpose: input.uploadPurpose.trim(), storageBucket: VISION_EVIDENCE_BUCKET, storagePath: `${input.ownerUserId}/${input.purpose}/${id}.${extensionForVisionEvidenceMimeType(input.mimeType)}`, expectedMimeType: input.mimeType, expectedBytes: input.expectedBytes, expiresAt, consentRecordedAt: input.consentRecordedAt ?? null, status: 'created' }
    await this.options.repository.createUploadIntent(intent)
    try {
      const upload = await this.options.provider.createSignedUploadUrl({ bucket: VISION_EVIDENCE_BUCKET, path: intent.storagePath, mimeType: input.mimeType, maxBytes: input.expectedBytes, intentExpiresAt: expiresAt })
      await this.options.repository.recordAudit({ eventType: 'vision.evidence.upload_intent_created', entityId: id, actorId: actor.userId, payload: { purpose: input.purpose, mimeType: input.mimeType, bytes: input.expectedBytes } })
      return { intent, upload }
    } catch {
      await this.options.repository.markUploadAbandoned(intent.id, this.now().toISOString())
      throw new VisionEvidenceStorageError('upload_intent_unavailable', 'Vision evidence upload intent could not be created.')
    }
  }

  async abandonUpload(actor: VisionEvidenceActor, intentId: string, reason: string): Promise<void> {
    activeActor(actor)
    if (!reason.trim() || reason.length > 240) throw new VisionEvidenceStorageError('invalid_abandon_reason', 'Abandoned Vision evidence uploads require a bounded reason.')
    const intent = await this.options.repository.getUploadIntent(intentId)
    if (!intent || !canManage(actor, intent.ownerUserId)) throw new VisionEvidenceStorageError('not_found', 'Vision evidence upload intent is unavailable to this actor.')
    if (intent.status !== 'created') return
    await this.options.repository.markUploadAbandoned(intent.id, this.now().toISOString())
    await this.options.repository.recordAudit({ eventType: 'vision.evidence.upload_abandoned', entityId: intent.id, actorId: actor.userId, payload: { reason: reason.trim() } })
  }

  async completeUpload(actor: VisionEvidenceActor, intentId: string, input: CompleteVisionEvidenceInput): Promise<VisionEvidenceMetadata> {
    activeActor(actor)
    const intent = await this.options.repository.getUploadIntent(intentId)
    if (!intent) throw new VisionEvidenceStorageError('intent_not_found', 'Vision evidence upload intent was not found.')
    if (intent.ownerUserId !== actor.userId && !canReview(actor)) throw new VisionEvidenceStorageError('owner_mismatch', 'Vision evidence upload ownership does not match the authenticated actor.')
    const now = this.now()
    if (intent.status !== 'created' || dateFrom(intent.expiresAt, 'invalid_intent').getTime() <= now.getTime()) throw new VisionEvidenceStorageError('intent_expired', 'Vision evidence upload intent is expired or no longer usable.')
    if (!isVisionEvidencePath(intent.storagePath) || !intent.storagePath.startsWith(`${intent.ownerUserId}/${intent.purpose}/`)) throw new VisionEvidenceStorageError('invalid_path', 'Vision evidence storage path is not server-generated and purpose-bound.')
    if (input.bytes !== intent.expectedBytes || input.bytes <= 0 || input.bytes > VISION_EVIDENCE_MAX_BYTES) throw new VisionEvidenceStorageError('byte_mismatch', 'Uploaded Vision evidence bytes do not match the reserved intent.')
    if (input.mimeType !== intent.expectedMimeType || !isVisionEvidenceMimeType(input.mimeType)) throw new VisionEvidenceStorageError('mime_mismatch', 'Uploaded Vision evidence MIME type does not match the reserved intent.')
    try {
      assertVisionEvidenceHash(input.sha256)
      assertVisionEvidenceDimensions(input.widthPx, input.heightPx)
    } catch (error) { mapExpectedValidation(error) }
    let object: Awaited<ReturnType<VisionEvidenceUploadProvider['headObject']>>
    try { object = await this.options.provider.headObject({ bucket: VISION_EVIDENCE_BUCKET, path: intent.storagePath }) } catch (error) { mapExpectedValidation(error) }
    if (!object || object.bucket !== VISION_EVIDENCE_BUCKET || object.path !== intent.storagePath || object.bytes !== input.bytes || object.mimeType !== input.mimeType || object.sha256 !== input.sha256 || object.widthPx !== input.widthPx || object.heightPx !== input.heightPx) throw new VisionEvidenceStorageError('object_unverified', 'Vision evidence metadata does not match the stored object.')
    const duplicate = await this.options.repository.findActiveBySha256(input.sha256)
    if (duplicate) { await this.options.provider.deleteObject({ bucket: VISION_EVIDENCE_BUCKET, path: intent.storagePath }); throw new VisionEvidenceStorageError('duplicate_evidence', 'An active Vision evidence object with this digest already exists.') }
    const metadata: VisionEvidenceMetadata = { ...object, id: this.createId(), uploadIntentId: intent.id, ownerUserId: intent.ownerUserId, purpose: intent.purpose, uploadPurpose: intent.uploadPurpose, consentRecordedAt: intent.consentRecordedAt, retentionUntil: retentionUntil({ ownerUserId: intent.ownerUserId, purpose: intent.purpose, uploadPurpose: intent.uploadPurpose, mimeType: intent.expectedMimeType, expectedBytes: intent.expectedBytes, consentRecordedAt: intent.consentRecordedAt }, intent.purpose, now, canReview(actor)), deletionRequestedAt: null, deletedAt: null, legalHold: false, verifiedAt: now.toISOString() }
    try {
      await this.options.repository.createVerifiedEvidence(metadata)
      await this.options.repository.markUploadCompleted(intent.id)
      await this.options.repository.recordAudit({ eventType: 'vision.evidence.verified', entityId: metadata.id, actorId: actor.userId, payload: { purpose: metadata.purpose, bytes: metadata.bytes, mimeType: metadata.mimeType } })
      return metadata
     } catch {
      await this.options.repository.markUploadAbandoned(intent.id, this.now().toISOString())
      try { await this.options.provider.deleteObject({ bucket: VISION_EVIDENCE_BUCKET, path: intent.storagePath }) } catch { /* containment is reported below */ }
      throw new VisionEvidenceStorageError('metadata_commit_failed', 'Vision evidence metadata could not be committed; the object was not trusted.')
    }
  }

  async getEvidenceMetadata(actor: VisionEvidenceActor, evidenceId: string): Promise<VisionEvidenceMetadata> {
    activeActor(actor)
    const evidence = await this.options.repository.getEvidence(evidenceId)
    if (!evidence || !canManage(actor, evidence.ownerUserId)) throw new VisionEvidenceStorageError('not_found', 'Vision evidence is unavailable to this actor.')
    return evidence
  }

  async createShortLivedReadUrl(actor: VisionEvidenceActor, evidenceId: string, requestedSeconds = 300): Promise<VisionEvidenceReadUrl> {
    const evidence = await this.getEvidenceMetadata(actor, evidenceId)
    if (evidence.deletedAt || evidence.deletionRequestedAt) throw new VisionEvidenceStorageError('not_available', 'Deleted or pending-deletion Vision evidence is not readable.')
    if (!Number.isInteger(requestedSeconds) || requestedSeconds < 1 || requestedSeconds > VISION_EVIDENCE_SIGNED_URL_MAX_SECONDS) throw new VisionEvidenceStorageError('invalid_url_expiry', 'Vision evidence read URLs must be short-lived.')
    const expiresAt = new Date(this.now().getTime() + requestedSeconds * 1000).toISOString()
    return this.options.provider.createSignedReadUrl({ bucket: VISION_EVIDENCE_BUCKET, path: evidence.path, expiresAt })
  }

  async verifyStoredObject(actor: VisionEvidenceActor, evidenceId: string): Promise<boolean> {
    const evidence = await this.getEvidenceMetadata(actor, evidenceId)
    const object = await this.options.provider.headObject({ bucket: VISION_EVIDENCE_BUCKET, path: evidence.path })
    return !!object && object.bucket === evidence.bucket && object.path === evidence.path && object.bytes === evidence.bytes && object.mimeType === evidence.mimeType && object.sha256 === evidence.sha256 && object.widthPx === evidence.widthPx && object.heightPx === evidence.heightPx
  }

  async requestEvidenceDeletion(actor: VisionEvidenceActor, evidenceId: string, reason: string): Promise<void> {
    const evidence = await this.getEvidenceMetadata(actor, evidenceId)
    if (!reason.trim() || reason.length > 240) throw new VisionEvidenceStorageError('invalid_deletion_reason', 'Vision evidence deletion requires a bounded reason.')
    const requestedAt = this.now().toISOString()
    await this.options.repository.requestDeletion(evidence.id, requestedAt, reason.trim())
    await this.options.repository.recordAudit({ eventType: 'vision.evidence.deletion_requested', entityId: evidence.id, actorId: actor.userId, payload: { reason: reason.trim() } })
  }

  async executeRetentionDeletion(actor: VisionEvidenceActor, evidenceId: string): Promise<void> {
    activeActor(actor)
    if (!canReview(actor)) throw new VisionEvidenceStorageError('forbidden', 'Only an authorised reviewer may execute Vision evidence retention deletion.')
    const evidence = await this.options.repository.getEvidence(evidenceId)
    if (!evidence || evidence.deletedAt) return
    if (evidence.legalHold) throw new VisionEvidenceStorageError('legal_hold', 'Vision evidence under legal or moderation hold cannot be deleted.')
    if (!evidence.deletionRequestedAt && dateFrom(evidence.retentionUntil, 'invalid_retention').getTime() > this.now().getTime()) throw new VisionEvidenceStorageError('retention_active', 'Vision evidence retention has not expired.')
    await this.options.provider.deleteObject({ bucket: VISION_EVIDENCE_BUCKET, path: evidence.path })
    await this.options.repository.markDeleted(evidence.id, this.now().toISOString())
    await this.options.repository.recordAudit({ eventType: 'vision.evidence.deleted', entityId: evidence.id, actorId: actor.userId, payload: { purpose: evidence.purpose, auditMetadataRetained: true } })
  }
}
