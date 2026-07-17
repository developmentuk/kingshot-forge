import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateGiftCodeAmbiguity } from './ambiguity.ts'
import {
  acquireGiftCodeQueueLease,
  recoverExpiredGiftCodeLease,
  selectGiftCodeQueueClaims,
  type GiftCodeQueueCandidate,
} from './queue.ts'
import { getGiftCodeRetryDecision } from './retry.ts'
import {
  createGiftCodeRedemptionAttempt,
  createGiftCodeRedemptionRequest,
  finalizeGiftCodeRedemptionAttempt,
  transitionGiftCodeRedemptionRequest,
} from './workflow.ts'

const now = '2026-07-17T12:00:00.000Z'

const candidate: GiftCodeQueueCandidate = {
  requestId: 'request-1',
  status: 'queued',
  nextAttemptAt: '2026-07-17T11:59:00.000Z',
  optimisticVersion: 3,
  completedAttempts: 0,
  securityHoldActive: false,
  cancellationRequested: false,
  consentCurrent: true,
  eligibilityCurrent: true,
  leaseOwner: null,
  leaseExpiresAt: null,
}

test('queue processing is disabled by default policy', () => {
  assert.deepEqual(
    selectGiftCodeQueueClaims([candidate], {
      now,
      queueProcessingEnabled: false,
      providerEnabled: false,
      providerHealthy: false,
      circuitState: 'open',
      backpressureActive: false,
      requestedBatchSize: 1,
    }),
    {
      code: 'queue_disabled',
      claimable: [],
      maximumBatchSize: 10,
    },
  )
})

test('claim order, batch size, and mutable rechecks are deterministic', () => {
  const result = selectGiftCodeQueueClaims(
    [
      { ...candidate, requestId: 'request-2' },
      { ...candidate, requestId: 'request-1' },
      {
        ...candidate,
        requestId: 'held-request',
        securityHoldActive: true,
      },
      {
        ...candidate,
        requestId: 'revoked-consent',
        consentCurrent: false,
      },
    ],
    {
      now,
      queueProcessingEnabled: true,
      providerEnabled: true,
      providerHealthy: true,
      circuitState: 'closed',
      backpressureActive: false,
      requestedBatchSize: 50,
    },
  )

  assert.deepEqual(
    result.claimable.map((item) => item.requestId),
    ['request-1', 'request-2'],
  )
  assert.equal(result.maximumBatchSize, 10)

  assert.deepEqual(
    selectGiftCodeQueueClaims([candidate], {
      now: 'invalid-timestamp',
      queueProcessingEnabled: true,
      providerEnabled: true,
      providerHealthy: true,
      circuitState: 'closed',
      backpressureActive: false,
      requestedBatchSize: 1,
    }),
    {
      code: 'request_conflict',
      claimable: [],
      maximumBatchSize: 10,
    },
  )
})

test('leases use optimistic versions and recover stale workers safely', () => {
  assert.equal(
    acquireGiftCodeQueueLease({
      candidate,
      expectedVersion: 2,
      workerId: 'worker-1',
      now,
    }).acquired,
    false,
  )

  const acquired = acquireGiftCodeQueueLease({
    candidate,
    expectedVersion: 3,
    workerId: 'worker-1',
    now,
  })
  assert.equal(acquired.acquired, true)
  if (acquired.acquired) {
    assert.equal(
      acquired.lease.leaseExpiresAt,
      '2026-07-17T12:01:30.000Z',
    )
  }

  assert.deepEqual(
    recoverExpiredGiftCodeLease({
      requestId: 'request-1',
      leaseExpiresAt: '2026-07-17T11:59:00.000Z',
      now,
      lastRequestDisposition: 'not_sent',
    }),
    {
      requestId: 'request-1',
      action: 'requeue',
      code: 'lease_expired',
      automaticRetryAllowed: true,
    },
  )
  assert.equal(
    recoverExpiredGiftCodeLease({
      requestId: 'request-1',
      leaseExpiresAt: '2026-07-17T11:59:00.000Z',
      now,
      lastRequestDisposition: 'unknown',
    })?.automaticRetryAllowed,
    false,
  )

  assert.deepEqual(
    acquireGiftCodeQueueLease({
      candidate: {
        ...candidate,
        leaseOwner: 'stale-worker',
        leaseExpiresAt: 'invalid-timestamp',
      },
      expectedVersion: 3,
      workerId: 'worker-1',
      now,
    }),
    {
      acquired: false,
      code: 'request_conflict',
    },
  )
  assert.equal(
    recoverExpiredGiftCodeLease({
      requestId: 'request-1',
      leaseExpiresAt: 'invalid-timestamp',
      now,
      lastRequestDisposition: 'not_sent',
    }),
    null,
  )
})

test('retry policy is bounded, jittered, and disposition-safe', () => {
  const clock = { now: () => new Date(now) }
  assert.deepEqual(
    getGiftCodeRetryDecision({
      completedAttempts: 1,
      resultCode: 'provider_retryable_failure',
      requestDisposition: 'not_sent',
      clock,
      jitter: { fraction: () => 0 },
    }),
    {
      shouldRetry: true,
      code: 'provider_retryable_failure',
      delaySeconds: 30,
      retryAt: '2026-07-17T12:00:30.000Z',
      remainingAttempts: 2,
      transportRetryAllowed: false,
    },
  )
  assert.equal(
    getGiftCodeRetryDecision({
      completedAttempts: 2,
      resultCode: 'rate_limited',
      requestDisposition: 'not_sent',
      retryAfterSeconds: 180,
      clock,
      jitter: { fraction: () => 1 },
    }).delaySeconds,
    180,
  )
  assert.equal(
    getGiftCodeRetryDecision({
      completedAttempts: 1,
      resultCode: 'provider_ambiguous',
      requestDisposition: 'unknown',
      clock,
      jitter: { fraction: () => 0 },
    }).shouldRetry,
    false,
  )
  assert.equal(
    getGiftCodeRetryDecision({
      completedAttempts: 3,
      resultCode: 'provider_not_sent',
      requestDisposition: 'not_sent',
      clock,
      jitter: { fraction: () => 0 },
    }).code,
    'retry_budget_exhausted',
  )
})

test('ambiguous outcomes lock every automatic replacement path', () => {
  const created = createGiftCodeRedemptionRequest({
    requestId: 'request-1',
    userId: 'user-1',
    characterInternalId: 'character-1',
    characterRevision: 1,
    consentId: 'consent-1',
    providerId: 'official-kingshot',
    environment: 'test',
    codePublicationId: 'publication-1',
    publicationVersion: '1',
    idempotencyHash: 'a'.repeat(64),
    eligibilityCode: 'eligibility_confirmed',
    now,
  })
  assert.equal(created.accepted, true)
  if (!created.accepted) return
  const queued = transitionGiftCodeRedemptionRequest({
    request: created.request,
    expectedVersion: 1,
    target: 'queued',
    resultCode: 'request_accepted',
    now,
    nextAttemptAt: now,
  })
  assert.equal(queued.transitioned, true)
  if (!queued.transitioned) return
  const processing = transitionGiftCodeRedemptionRequest({
    request: queued.request,
    expectedVersion: queued.request.optimisticVersion,
    target: 'processing',
    resultCode: 'request_accepted',
    now,
  })
  assert.equal(processing.transitioned, true)
  if (!processing.transitioned) return
  const ambiguous = transitionGiftCodeRedemptionRequest({
    request: processing.request,
    expectedVersion: processing.request.optimisticVersion,
    target: 'ambiguous',
    resultCode: 'provider_ambiguous',
    now,
  })
  assert.equal(ambiguous.transitioned, true)
  if (!ambiguous.transitioned) return

  const attempt = createGiftCodeRedemptionAttempt({
    attemptId: 'attempt-1',
    requestId: 'request-1',
    ordinal: 1,
    startedAt: now,
  })
  assert.ok(attempt)
  const finalized = finalizeGiftCodeRedemptionAttempt({
    attempt,
    expectedVersion: 0,
    outcome: 'provider_ambiguous',
    requestDisposition: 'unknown',
    resultCode: 'provider_ambiguous',
    safeDiagnosticCode: 'outcome_unknown',
    completedAt: now,
    classificationEvidence: 'local_control',
  })
  assert.equal(finalized.finalized, true)
  if (!finalized.finalized) return

  assert.deepEqual(
    evaluateGiftCodeAmbiguity({
      request: ambiguous.request,
      attempt: finalized.attempt,
    }),
    {
      automaticRetryAllowed: false,
      userRetryAllowed: false,
      replacementRequestAllowed: false,
      reconciliationRequired: true,
      supportReviewAllowed: true,
      safeResultCode: 'provider_ambiguous',
    },
  )
})
