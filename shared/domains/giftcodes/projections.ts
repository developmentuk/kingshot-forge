import type { GiftCodeResultCode } from './resultCodes.ts'
import type {
  GiftCodeRedemptionAttemptOutcome,
  GiftCodeRedemptionRequestState,
} from './workflow.ts'

export type GiftCodeConsentStatusProjection = Readonly<{
  consentId: string
  characterRef: string
  providerId: string
  providerMode: string
  policyVersion: string
  grantedAt: string
  revokedAt: string | null
  expiresAt: string | null
  valid: boolean
}>

export type GiftCodeRequestHistoryProjection = Readonly<{
  requestId: string
  characterRef: string
  providerId: string
  environment: string
  codePublicationId: string
  publicationVersion: string
  status: GiftCodeRedemptionRequestState
  resultCode: GiftCodeResultCode
  createdAt: string
  updatedAt: string
}>

export type GiftCodeRequestDetailProjection =
  GiftCodeRequestHistoryProjection &
    Readonly<{
      completedAttempts: number
      nextAttemptAt: string | null
      cancellable: boolean
      retryAvailable: boolean
      ambiguityReviewRequired: boolean
    }>

export type GiftCodeAttemptSummaryProjection = Readonly<{
  attemptId: string
  requestId: string
  ordinal: number
  outcome: GiftCodeRedemptionAttemptOutcome
  resultCode: GiftCodeResultCode
  startedAt: string
  completedAt: string | null
}>

export type GiftCodeEligibilityContextProjection = Readonly<{
  characterRef: string
  characterDisplayName: string
  characterAvatarUrl: string | null
  providerId: string
  providerAvailable: boolean
  consentValid: boolean
  eligible: boolean
  reasons: readonly GiftCodeResultCode[]
}>

export function projectGiftCodeConsentStatus(
  input: GiftCodeConsentStatusProjection,
) {
  return Object.freeze({ ...input })
}
export function projectGiftCodeRequestHistory(
  input: GiftCodeRequestHistoryProjection,
) {
  return Object.freeze({ ...input })
}

export function projectGiftCodeRequestDetail(input: {
  request: GiftCodeRequestHistoryProjection
  completedAttempts: number
  nextAttemptAt: string | null
}) {
  const cancellable = [
    'requested',
    'queued',
    'failed_retryable',
  ].includes(input.request.status)
  const retryAvailable =
    input.request.status === 'failed_retryable' &&
    input.completedAttempts < 3

  return Object.freeze({
    ...input.request,
    completedAttempts: input.completedAttempts,
    nextAttemptAt: input.nextAttemptAt,
    cancellable,
    retryAvailable,
    ambiguityReviewRequired:
      input.request.status === 'ambiguous',
  })
}

export function projectGiftCodeAttemptSummary(
  input: GiftCodeAttemptSummaryProjection,
) {
  return Object.freeze({ ...input })
}

export function projectGiftCodeEligibilityContext(
  input: GiftCodeEligibilityContextProjection,
) {
  return Object.freeze({
    ...input,
    reasons: Object.freeze([...input.reasons]),
  })
}
