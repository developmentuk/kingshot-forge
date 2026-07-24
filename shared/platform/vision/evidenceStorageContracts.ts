export const VISION_EVIDENCE_BUCKET = 'vision-evidence' as const
export const VISION_EVIDENCE_MAX_BYTES = 16 * 1024 * 1024
export const VISION_EVIDENCE_MAX_PIXELS = 40_000_000
export const VISION_EVIDENCE_INTENT_SECONDS = 15 * 60
export const VISION_EVIDENCE_PROVIDER_UPLOAD_SECONDS = 2 * 60 * 60
export const VISION_EVIDENCE_SIGNED_URL_MAX_SECONDS = 300

export const VISION_EVIDENCE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/tiff'] as const
export type VisionEvidenceMimeType = (typeof VISION_EVIDENCE_MIME_TYPES)[number]

export const VISION_EVIDENCE_PURPOSES = ['mapping_reference', 'test_case', 'scan_source', 'evidence_crop'] as const
export type VisionEvidencePurpose = (typeof VISION_EVIDENCE_PURPOSES)[number]

export const VISION_EVIDENCE_RETENTION_POLICIES = {
  mapping_reference: { defaultDays: 30, maximumDays: 365 },
  test_case: { defaultDays: 30, maximumDays: 180 },
  scan_source: { defaultDays: 7, maximumDays: 30 },
  evidence_crop: { defaultDays: 7, maximumDays: 30 },
  failed_upload: { defaultDays: 1, maximumDays: 7 },
} as const

export type VisionEvidencePermission = 'vision.evidence.review' | 'vision.admin.read'

export type VisionEvidenceValidationCode = 'invalid_hash' | 'invalid_dimensions' | 'excessive_pixels' | 'invalid_image'

export class VisionEvidenceValidationError extends Error {
  readonly code: VisionEvidenceValidationCode
  constructor(code: VisionEvidenceValidationCode, message: string) { super(message); this.name = 'VisionEvidenceValidationError'; this.code = code }
}

export interface VisionEvidenceActor {
  userId: string | null
  accountStatus: 'active' | 'inactive'
  permissions: readonly string[]
}

export interface VisionEvidenceUploadIntent {
  id: string
  ownerUserId: string
  purpose: VisionEvidencePurpose
  uploadPurpose: string
  storageBucket: typeof VISION_EVIDENCE_BUCKET
  storagePath: string
  expectedMimeType: VisionEvidenceMimeType
  expectedBytes: number
  expiresAt: string
  consentRecordedAt: string | null
  status: 'created' | 'completed' | 'abandoned' | 'expired'
}

export interface VisionStoredObjectMetadata {
  bucket: string
  path: string
  bytes: number
  mimeType: string
  sha256: string
  widthPx: number
  heightPx: number
}

export interface VisionEvidenceMetadata extends VisionStoredObjectMetadata {
  id: string
  uploadIntentId: string
  ownerUserId: string | null
  purpose: VisionEvidencePurpose
  uploadPurpose: string
  consentRecordedAt: string | null
  retentionUntil: string
  deletionRequestedAt: string | null
  deletedAt: string | null
  legalHold: boolean
  verifiedAt: string
}

export interface CreateVisionEvidenceIntentInput {
  ownerUserId: string
  purpose: VisionEvidencePurpose
  uploadPurpose: string
  mimeType: VisionEvidenceMimeType
  expectedBytes: number
  consentRecordedAt?: string | null
  retentionUntil?: string
}

export interface CompleteVisionEvidenceInput {
  bytes: number
  mimeType: VisionEvidenceMimeType
  sha256: string
  widthPx: number
  heightPx: number
}

export interface VisionEvidenceUploadUrl {
  url: string | null
  token: string
  bucket: typeof VISION_EVIDENCE_BUCKET
  path: string
  providerLifetimeSeconds: typeof VISION_EVIDENCE_PROVIDER_UPLOAD_SECONDS
  expiresAt: string
}

export interface VisionEvidenceReadUrl {
  url: string
  expiresAt: string
}

export interface VisionEvidenceUploadProvider {
  createSignedUploadUrl(input: {
    bucket: typeof VISION_EVIDENCE_BUCKET
    path: string
    mimeType: VisionEvidenceMimeType
    maxBytes: number
    intentExpiresAt: string
  }): Promise<VisionEvidenceUploadUrl>
  headObject(input: { bucket: typeof VISION_EVIDENCE_BUCKET; path: string }): Promise<VisionStoredObjectMetadata | null>
  createSignedReadUrl(input: { bucket: typeof VISION_EVIDENCE_BUCKET; path: string; expiresAt: string }): Promise<VisionEvidenceReadUrl>
  deleteObject(input: { bucket: typeof VISION_EVIDENCE_BUCKET; path: string }): Promise<void>
}

export interface VisionEvidenceRepository {
  createUploadIntent(intent: VisionEvidenceUploadIntent): Promise<void>
  getUploadIntent(id: string): Promise<VisionEvidenceUploadIntent | null>
  markUploadAbandoned(id: string, abandonedAt: string): Promise<void>
  markUploadCompleted(id: string): Promise<void>
  findActiveBySha256(sha256: string): Promise<VisionEvidenceMetadata | null>
  createVerifiedEvidence(metadata: VisionEvidenceMetadata): Promise<void>
  getEvidence(id: string): Promise<VisionEvidenceMetadata | null>
  requestDeletion(id: string, requestedAt: string, reason: string): Promise<void>
  markDeleted(id: string, deletedAt: string): Promise<void>
  recordAudit(input: { eventType: string; entityId: string; actorId: string | null; payload: Record<string, unknown> }): Promise<void>
}

export function isVisionEvidenceMimeType(value: string): value is VisionEvidenceMimeType {
  return (VISION_EVIDENCE_MIME_TYPES as readonly string[]).includes(value)
}

export function extensionForVisionEvidenceMimeType(mimeType: VisionEvidenceMimeType): string {
  return { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/tiff': 'tiff' }[mimeType]
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function isVisionEvidencePath(path: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/(mapping_reference|test_case|scan_source|evidence_crop)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|webp|tiff)$/i.test(path)
}

export function assertVisionEvidenceHash(sha256: string): void {
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new VisionEvidenceValidationError('invalid_hash', 'Vision evidence requires a lowercase SHA-256 digest.')
}

export function assertVisionEvidenceDimensions(widthPx: number, heightPx: number): void {
  if (!Number.isInteger(widthPx) || widthPx <= 0 || !Number.isInteger(heightPx) || heightPx <= 0) throw new VisionEvidenceValidationError('invalid_dimensions', 'Vision evidence dimensions must be positive integers.')
}
