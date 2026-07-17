export const SOURCE_EVIDENCE_ORIGINS = [
  'official',
  'authoritative-publisher',
  'approved-community',
  'community',
  'user-submitted',
  'archive',
  'unknown',
] as const

export const SOURCE_EVIDENCE_REVIEW_STATUSES = [
  'extracted',
  'staged',
  'reviewed',
  'approved',
  'rejected',
  'withdrawn',
  'superseded',
] as const

export const SOURCE_EVIDENCE_LICENSING_DECISIONS = [
  'pending',
  'approved',
  'rejected',
  'restricted',
] as const

export const SOURCE_EVIDENCE_EXTRACTION_METHODS = [
  'manual',
  'structured-file',
  'api',
  'scrape',
  'screenshot',
  'other',
] as const

export type SourceEvidenceOrigin =
  (typeof SOURCE_EVIDENCE_ORIGINS)[number]

export type SourceEvidenceReviewStatus =
  (typeof SOURCE_EVIDENCE_REVIEW_STATUSES)[number]

export type SourceEvidenceLicensingDecision =
  (typeof SOURCE_EVIDENCE_LICENSING_DECISIONS)[number]

export type SourceEvidenceExtractionMethod =
  (typeof SOURCE_EVIDENCE_EXTRACTION_METHODS)[number]

export interface SourceEvidenceRecord {
  id: string
  datasetId: string
  sourceKey: string
  origin: SourceEvidenceOrigin
  sourceName: string
  sourceUrl: string | null
  retrievedAt: string
  contentDigest: string
  sourceVersion: string | null
  licensingDecision: SourceEvidenceLicensingDecision
  attribution: string | null
  extractionMethod: SourceEvidenceExtractionMethod
  reviewedBy: string | null
  reviewedAt: string | null
  reviewStatus: SourceEvidenceReviewStatus
  evidenceNotes: string | null
  supersededById: string | null
  supersededAt: string | null
  withdrawnAt: string | null
  withdrawalReason: string | null
  revision: number
  createdAt: string
  updatedAt: string
}

export interface PublicSourceSummary {
  name: string
  url: string | null
  sourceVersion: string | null
  retrievedAt: string
}

export interface SourceEvidenceValidationIssue {
  path: string
  message: string
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DATASET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SOURCE_KEY_PATTERN = /^[a-z0-9]+(?:[a-z0-9._:/-]*[a-z0-9])?$/
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    !Number.isNaN(Date.parse(value))
  )
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function includesValue<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return typeof value === 'string' && values.includes(value as T)
}

export function isSha256Digest(value: unknown): value is string {
  return typeof value === 'string' && SHA256_PATTERN.test(value)
}

export function validateSourceEvidenceRecord(
  value: unknown,
): SourceEvidenceValidationIssue[] {
  if (!isRecord(value)) {
    return [{ path: '', message: 'Source evidence must be an object.' }]
  }

  const issues: SourceEvidenceValidationIssue[] = []
  const evidence = value as Partial<SourceEvidenceRecord>

  if (typeof evidence.id !== 'string' || !UUID_PATTERN.test(evidence.id)) {
    issues.push({ path: 'id', message: 'Evidence ID must be a UUID.' })
  }

  if (
    typeof evidence.datasetId !== 'string' ||
    !DATASET_ID_PATTERN.test(evidence.datasetId)
  ) {
    issues.push({
      path: 'datasetId',
      message: 'Dataset ID must be lowercase kebab-case.',
    })
  }

  if (
    typeof evidence.sourceKey !== 'string' ||
    !SOURCE_KEY_PATTERN.test(evidence.sourceKey)
  ) {
    issues.push({
      path: 'sourceKey',
      message: 'Source key must be a stable lowercase identifier.',
    })
  }

  if (!includesValue(SOURCE_EVIDENCE_ORIGINS, evidence.origin)) {
    issues.push({ path: 'origin', message: 'Source origin is invalid.' })
  }

  if (!isNonEmptyString(evidence.sourceName)) {
    issues.push({ path: 'sourceName', message: 'Source name is required.' })
  }

  if (evidence.sourceUrl !== null && !isHttpUrl(evidence.sourceUrl)) {
    issues.push({
      path: 'sourceUrl',
      message: 'Source URL must be HTTP, HTTPS or null.',
    })
  }

  if (!isTimestamp(evidence.retrievedAt)) {
    issues.push({
      path: 'retrievedAt',
      message: 'Retrieval timestamp must be a valid date-time.',
    })
  }

  if (!isSha256Digest(evidence.contentDigest)) {
    issues.push({
      path: 'contentDigest',
      message: 'Content digest must use sha256:<64 lowercase hex characters>.',
    })
  }

  if (!isNullableString(evidence.sourceVersion)) {
    issues.push({
      path: 'sourceVersion',
      message: 'Source version must be text or null.',
    })
  }

  if (
    !includesValue(
      SOURCE_EVIDENCE_LICENSING_DECISIONS,
      evidence.licensingDecision,
    )
  ) {
    issues.push({
      path: 'licensingDecision',
      message: 'Licensing decision is invalid.',
    })
  }

  if (!isNullableString(evidence.attribution)) {
    issues.push({
      path: 'attribution',
      message: 'Attribution must be text or null.',
    })
  }

  if (
    !includesValue(
      SOURCE_EVIDENCE_EXTRACTION_METHODS,
      evidence.extractionMethod,
    )
  ) {
    issues.push({
      path: 'extractionMethod',
      message: 'Extraction method is invalid.',
    })
  }

  if (
    !includesValue(
      SOURCE_EVIDENCE_REVIEW_STATUSES,
      evidence.reviewStatus,
    )
  ) {
    issues.push({
      path: 'reviewStatus',
      message: 'Evidence review status is invalid.',
    })
  }

  for (const key of [
    'reviewedBy',
    'evidenceNotes',
    'withdrawalReason',
  ] as const) {
    if (!isNullableString(evidence[key])) {
      issues.push({
        path: key,
        message: `${key} must be text or null.`,
      })
    }
  }

  for (const key of [
    'reviewedAt',
    'supersededAt',
    'withdrawnAt',
  ] as const) {
    const timestamp = evidence[key]
    if (timestamp !== null && !isTimestamp(timestamp)) {
      issues.push({
        path: key,
        message: `${key} must be a valid date-time or null.`,
      })
    }
  }

  if (
    evidence.supersededById !== null &&
    (typeof evidence.supersededById !== 'string' ||
      !UUID_PATTERN.test(evidence.supersededById))
  ) {
    issues.push({
      path: 'supersededById',
      message: 'Superseding evidence ID must be a UUID or null.',
    })
  }

  if (!Number.isInteger(evidence.revision) || Number(evidence.revision) < 1) {
    issues.push({
      path: 'revision',
      message: 'Evidence revision must be a positive integer.',
    })
  }

  for (const key of ['createdAt', 'updatedAt'] as const) {
    if (!isTimestamp(evidence[key])) {
      issues.push({
        path: key,
        message: `${key} must be a valid date-time.`,
      })
    }
  }

  if (evidence.reviewStatus === 'approved') {
    if (!isNonEmptyString(evidence.sourceVersion)) {
      issues.push({
        path: 'sourceVersion',
        message: 'Approved evidence requires a source version or explicit unversioned marker.',
      })
    }
    if (!isNonEmptyString(evidence.reviewedBy)) {
      issues.push({
        path: 'reviewedBy',
        message: 'Approved evidence requires a reviewer.',
      })
    }
    if (!isTimestamp(evidence.reviewedAt)) {
      issues.push({
        path: 'reviewedAt',
        message: 'Approved evidence requires a review timestamp.',
      })
    }
    if (evidence.licensingDecision !== 'approved') {
      issues.push({
        path: 'licensingDecision',
        message: 'Approved evidence requires an approved permitted-use decision.',
      })
    }
    if (!isNonEmptyString(evidence.attribution)) {
      issues.push({
        path: 'attribution',
        message: 'Approved evidence must record attribution or that none is required.',
      })
    }
  }

  if (evidence.reviewStatus === 'withdrawn') {
    if (!isTimestamp(evidence.withdrawnAt)) {
      issues.push({
        path: 'withdrawnAt',
        message: 'Withdrawn evidence requires a withdrawal timestamp.',
      })
    }
    if (!isNonEmptyString(evidence.withdrawalReason)) {
      issues.push({
        path: 'withdrawalReason',
        message: 'Withdrawn evidence requires a reason.',
      })
    }
  } else if (evidence.withdrawnAt !== null || evidence.withdrawalReason !== null) {
    issues.push({
      path: 'reviewStatus',
      message: 'Withdrawal metadata requires withdrawn review status.',
    })
  }

  if (evidence.reviewStatus === 'superseded') {
    if (evidence.supersededById === null) {
      issues.push({
        path: 'supersededById',
        message: 'Superseded evidence requires the replacement evidence ID.',
      })
    }
    if (!isTimestamp(evidence.supersededAt)) {
      issues.push({
        path: 'supersededAt',
        message: 'Superseded evidence requires a timestamp.',
      })
    }
    if (evidence.supersededById === evidence.id) {
      issues.push({
        path: 'supersededById',
        message: 'Evidence cannot supersede itself.',
      })
    }
  } else if (evidence.supersededById !== null || evidence.supersededAt !== null) {
    issues.push({
      path: 'reviewStatus',
      message: 'Supersession metadata requires superseded review status.',
    })
  }

  return issues
}

export function canSourceEvidenceSupportCanonical(
  evidence: SourceEvidenceRecord,
): boolean {
  return (
    validateSourceEvidenceRecord(evidence).length === 0 &&
    evidence.reviewStatus === 'approved' &&
    evidence.licensingDecision === 'approved' &&
    evidence.withdrawnAt === null &&
    evidence.supersededById === null
  )
}

export function toPublicSourceSummary(
  evidence: SourceEvidenceRecord,
): PublicSourceSummary {
  return {
    name: evidence.sourceName,
    url: evidence.sourceUrl,
    sourceVersion: evidence.sourceVersion,
    retrievedAt: evidence.retrievedAt,
  }
}
