import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createGiftCodeRedemptionAttempt,
  createGiftCodeRedemptionRequest,
  finalizeGiftCodeRedemptionAttempt,
  setGiftCodeRequestSecurityHold,
  transitionGiftCodeRedemptionRequest,
  type GiftCodeRequestSnapshot,
} from './workflow.ts'

const now = '2026-07-17T12:00:00.000Z'

function request() {
  const result = createGiftCodeRedemptionRequest({
    requestId: 'request-1',
    userId: 'user-1',
    characterInternalId: 'character-1',
    characterRevision: 2,
    consentId: 'consent-1',
    providerId: 'simulation',
    environment: 'test',
    codePublicationId: 'publication-1',
    publicationVersion: '3',
    idempotencyHash: 'a'.repeat(64),
    eligibilityCode: 'eligibility_confirmed',
    now,
  })

  assert.equal(result.accepted, true)
  if (!result.accepted) throw new Error('fixture was rejected')
  return result.request
}

function transition(
  current: GiftCodeRequestSnapshot,
  target: Parameters<typeof transitionGiftCodeRedemptionRequest>[0]['target'],
  resultCode: Parameters<typeof transitionGiftCodeRedemptionRequest>[0]['resultCode'],
) {
  const result = transitionGiftCodeRedemptionRequest({
    request: current,
    expectedVersion: current.optimisticVersion,
    target,
    resultCode,
    now,
    nextAttemptAt:
      target === 'queued' || target === 'failed_retryable'
        ? '2026-07-17T12:00:30.000Z'
        : null,
  })
  assert.equal(result.transitioned, true)
  if (!result.transitioned) throw new Error('transition failed')
  return result.request
}

test('request lifecycle permits only explicit validated transitions', () => {
  const requested = request()
  const queued = transition(requested, 'queued', 'request_accepted')
  const processing = transition(
    queued,
    'processing',
    'request_accepted',
  )
  const succeeded = transition(
    processing,
    'succeeded',
    'provider_success',
  )

  assert.equal(processing.completedAttempts, 1)
  assert.equal(succeeded.status, 'succeeded')
  assert.equal(succeeded.terminalAt, now)
  assert.equal(
    transitionGiftCodeRedemptionRequest({
      request: succeeded,
      expectedVersion: succeeded.optimisticVersion,
      target: 'queued',
      resultCode: 'request_accepted',
      now,
    }).transitioned,
    false,
  )
})
test('stale transitions and success without the success code fail closed', () => {
  const requested = request()
  assert.deepEqual(
    transitionGiftCodeRedemptionRequest({
      request: requested,
      expectedVersion: 0,
      target: 'queued',
      resultCode: 'request_accepted',
      now,
    }).code,
    'stale_version',
  )

  const processing = transition(
    transition(requested, 'queued', 'request_accepted'),
    'processing',
    'request_accepted',
  )
  assert.equal(
    transitionGiftCodeRedemptionRequest({
      request: processing,
      expectedVersion: processing.optimisticVersion,
      target: 'succeeded',
      resultCode: 'provider_not_sent',
      now,
    }).transitioned,
    false,
  )
})

test('cancellation, expiry, withdrawal, and security holds are explicit', () => {
  const requested = request()
  assert.equal(
    transition(requested, 'cancelled', 'request_cancelled').status,
    'cancelled',
  )
  assert.equal(
    transition(request(), 'expired', 'request_expired').status,
    'expired',
  )
  assert.equal(
    transition(request(), 'withdrawn', 'request_withdrawn').status,
    'withdrawn',
  )

  const held = setGiftCodeRequestSecurityHold({
    request: requested,
    expectedVersion: requested.optimisticVersion,
    active: true,
    now,
  })
  assert.equal(held.transitioned, true)
  if (!held.transitioned) return
  assert.equal(
    transitionGiftCodeRedemptionRequest({
      request: held.request,
      expectedVersion: held.request.optimisticVersion,
      target: 'queued',
      resultCode: 'request_accepted',
      now,
    }).code,
    'security_hold',
  )
})

test('attempt lifecycle is finalize-once and never infers success', () => {
  const attempt = createGiftCodeRedemptionAttempt({
    attemptId: 'attempt-1',
    requestId: 'request-1',
    ordinal: 1,
    startedAt: now,
  })
  assert.ok(attempt)

  const invalidSuccess = finalizeGiftCodeRedemptionAttempt({
    attempt,
    expectedVersion: 0,
    outcome: 'provider_success',
    requestDisposition: 'sent',
    resultCode: 'provider_success',
    safeDiagnosticCode: 'http_accepted',
    completedAt: now,
    classificationEvidence: 'local_control',
  })
  assert.equal(invalidSuccess.finalized, false)

  const simulated = finalizeGiftCodeRedemptionAttempt({
    attempt,
    expectedVersion: 0,
    outcome: 'simulated',
    requestDisposition: 'not_sent',
    resultCode: 'simulation_only',
    safeDiagnosticCode: 'simulation_only',
    completedAt: now,
    classificationEvidence: 'simulation',
  })
  assert.equal(simulated.finalized, true)
  if (!simulated.finalized) return
  assert.equal(
    finalizeGiftCodeRedemptionAttempt({
      attempt: simulated.attempt,
      expectedVersion: 1,
      outcome: 'provider_success',
      requestDisposition: 'sent',
      resultCode: 'provider_success',
      safeDiagnosticCode: 'confirmed',
      completedAt: now,
      classificationEvidence: 'validated_provider_response',
    }).finalized,
    false,
  )
})
