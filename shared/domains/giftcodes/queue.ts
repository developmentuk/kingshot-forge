import type { GiftCodeProviderCircuitState } from './providerHealth.ts'
import type { GiftCodeResultCode } from './resultCodes.ts'
import type { GiftCodeRedemptionRequestState } from './workflow.ts'

export const GIFT_CODE_MAXIMUM_CLAIM_BATCH_SIZE = 10 as const
export const GIFT_CODE_DEFAULT_LEASE_SECONDS = 90 as const
export const GIFT_CODE_MAXIMUM_LEASE_SECONDS = 120 as const

export type GiftCodeQueueCandidate = Readonly<{
  requestId: string
  status: GiftCodeRedemptionRequestState
  nextAttemptAt: string
  optimisticVersion: number
  completedAttempts: number
  securityHoldActive: boolean
  cancellationRequested: boolean
  consentCurrent: boolean
  eligibilityCurrent: boolean
  leaseOwner: string | null
  leaseExpiresAt: string | null
}>

export type GiftCodeQueueClaimContext = Readonly<{
  now: string
  queueProcessingEnabled: boolean
  providerEnabled: boolean
  providerHealthy: boolean
  circuitState: GiftCodeProviderCircuitState
  backpressureActive: boolean
  requestedBatchSize: number
}>

export type GiftCodeQueueSelection = Readonly<{
  code: GiftCodeResultCode
  claimable: readonly GiftCodeQueueCandidate[]
  maximumBatchSize: typeof GIFT_CODE_MAXIMUM_CLAIM_BATCH_SIZE
}>

export type GiftCodeQueueLease = Readonly<{
  requestId: string
  workerId: string
  claimedVersion: number
  leaseAcquiredAt: string
  leaseExpiresAt: string
}>

export type GiftCodeLeaseRecovery = Readonly<{
  requestId: string
  action: 'requeue' | 'mark_ambiguous'
  code: 'lease_expired' | 'provider_ambiguous'
  automaticRetryAllowed: boolean
}>

function isDue(candidate: GiftCodeQueueCandidate, now: number) {
  return Date.parse(candidate.nextAttemptAt) <= now
}

function hasAvailableLease(
  candidate: GiftCodeQueueCandidate,
  now: number,
) {
  return (
    candidate.leaseOwner === null ||
    (candidate.leaseExpiresAt !== null &&
      Date.parse(candidate.leaseExpiresAt) <= now)
  )
}

export function selectGiftCodeQueueClaims(
  candidates: readonly GiftCodeQueueCandidate[],
  context: GiftCodeQueueClaimContext,
): GiftCodeQueueSelection {
  if (!context.queueProcessingEnabled) {
    return Object.freeze({
      code: 'queue_disabled',
      claimable: Object.freeze([]),
      maximumBatchSize: GIFT_CODE_MAXIMUM_CLAIM_BATCH_SIZE,
    })
  }

  if (
    !context.providerEnabled ||
    !context.providerHealthy ||
    context.circuitState !== 'closed'
  ) {
    return Object.freeze({
      code: !context.providerEnabled
        ? 'provider_disabled'
        : 'provider_unhealthy',
      claimable: Object.freeze([]),
      maximumBatchSize: GIFT_CODE_MAXIMUM_CLAIM_BATCH_SIZE,
    })
  }

  if (context.backpressureActive) {
    return Object.freeze({
      code: 'queue_backpressure',
      claimable: Object.freeze([]),
      maximumBatchSize: GIFT_CODE_MAXIMUM_CLAIM_BATCH_SIZE,
    })
  }

  if (
    !Number.isInteger(context.requestedBatchSize) ||
    context.requestedBatchSize < 1 ||
    Number.isNaN(Date.parse(context.now))
  ) {
    return Object.freeze({
      code: 'request_conflict',
      claimable: Object.freeze([]),
      maximumBatchSize: GIFT_CODE_MAXIMUM_CLAIM_BATCH_SIZE,
    })
  }

  const now = Date.parse(context.now)
  const batchSize = Math.min(
    context.requestedBatchSize,
    GIFT_CODE_MAXIMUM_CLAIM_BATCH_SIZE,
  )
  const claimable = candidates
    .filter(
      (candidate) =>
        (candidate.status === 'queued' ||
          candidate.status === 'failed_retryable') &&
        candidate.completedAttempts < 3 &&
        !candidate.securityHoldActive &&
        !candidate.cancellationRequested &&
        candidate.consentCurrent &&
        candidate.eligibilityCurrent &&
        isDue(candidate, now) &&
        hasAvailableLease(candidate, now),
    )
    .sort(
      (left, right) =>
        Date.parse(left.nextAttemptAt) -
          Date.parse(right.nextAttemptAt) ||
        left.requestId.localeCompare(right.requestId),
    )
    .slice(0, batchSize)

  return Object.freeze({
    code: 'request_accepted',
    claimable: Object.freeze(claimable),
    maximumBatchSize: GIFT_CODE_MAXIMUM_CLAIM_BATCH_SIZE,
  })
}

export function acquireGiftCodeQueueLease(input: {
  candidate: GiftCodeQueueCandidate
  expectedVersion: number
  workerId: string
  now: string
  leaseSeconds?: number
}):
  | Readonly<{
      acquired: true
      lease: GiftCodeQueueLease
    }>
  | Readonly<{
      acquired: false
      code: 'lease_unavailable' | 'stale_version' | 'request_conflict'
    }> {
  if (input.expectedVersion !== input.candidate.optimisticVersion) {
    return Object.freeze({
      acquired: false,
      code: 'stale_version',
    })
  }

  const now = Date.parse(input.now)
  const leaseSeconds =
    input.leaseSeconds ?? GIFT_CODE_DEFAULT_LEASE_SECONDS
  const existingLeaseExpiresAt =
    input.candidate.leaseExpiresAt === null
      ? null
      : Date.parse(input.candidate.leaseExpiresAt)

  if (
    input.workerId.trim().length === 0 ||
    Number.isNaN(now) ||
    (input.candidate.leaseOwner === null &&
      input.candidate.leaseExpiresAt !== null) ||
    (input.candidate.leaseOwner !== null &&
      (existingLeaseExpiresAt === null ||
        Number.isNaN(existingLeaseExpiresAt))) ||
    !Number.isInteger(leaseSeconds) ||
    leaseSeconds < 1 ||
    leaseSeconds > GIFT_CODE_MAXIMUM_LEASE_SECONDS
  ) {
    return Object.freeze({
      acquired: false,
      code: 'request_conflict',
    })
  }

  if (
    input.candidate.leaseOwner !== null &&
    existingLeaseExpiresAt !== null &&
    existingLeaseExpiresAt > now
  ) {
    return Object.freeze({
      acquired: false,
      code: 'lease_unavailable',
    })
  }

  return Object.freeze({
    acquired: true,
    lease: Object.freeze({
      requestId: input.candidate.requestId,
      workerId: input.workerId.trim(),
      claimedVersion: input.candidate.optimisticVersion,
      leaseAcquiredAt: new Date(now).toISOString(),
      leaseExpiresAt: new Date(
        now + leaseSeconds * 1000,
      ).toISOString(),
    }),
  })
}

export function recoverExpiredGiftCodeLease(input: {
  requestId: string
  leaseExpiresAt: string
  now: string
  lastRequestDisposition: 'not_sent' | 'sent' | 'unknown'
}): GiftCodeLeaseRecovery | null {
  const leaseExpiresAt = Date.parse(input.leaseExpiresAt)
  const now = Date.parse(input.now)

  if (
    Number.isNaN(leaseExpiresAt) ||
    Number.isNaN(now) ||
    leaseExpiresAt > now
  ) {
    return null
  }

  if (input.lastRequestDisposition === 'not_sent') {
    return Object.freeze({
      requestId: input.requestId,
      action: 'requeue',
      code: 'lease_expired',
      automaticRetryAllowed: true,
    })
  }

  return Object.freeze({
    requestId: input.requestId,
    action: 'mark_ambiguous',
    code: 'provider_ambiguous',
    automaticRetryAllowed: false,
  })
}
