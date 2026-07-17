import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GIFT_CODE_API_CONTRACTS,
  parseStrictGiftCodeBody,
} from './apiContracts.ts'
import {
  evaluateGiftCodeSupportAction,
  type GiftCodeServerCapability,
} from './capabilities.ts'
import {
  projectGiftCodeAttemptSummary,
  projectGiftCodeEligibilityContext,
  projectGiftCodeRequestDetail,
  projectGiftCodeRequestHistory,
} from '../../shared/domains/giftcodes/projections.ts'
import { createGiftCodeRedemptionRequest } from '../../shared/domains/giftcodes/workflow.ts'

const history = {
  requestId: 'request-1',
  characterRef: 'character-ref-1',
  providerId: 'official-kingshot',
  environment: 'test',
  codePublicationId: 'publication-1',
  publicationVersion: '4',
  status: 'failed_retryable' as const,
  resultCode: 'provider_not_sent' as const,
  createdAt: '2026-07-17T12:00:00.000Z',
  updatedAt: '2026-07-17T12:01:00.000Z',
}

test('public projections expose only UI-safe fields', () => {
  const historyProjection = projectGiftCodeRequestHistory(history)
  const detailProjection = projectGiftCodeRequestDetail({
    request: history,
    completedAttempts: 1,
    nextAttemptAt: '2026-07-17T12:02:00.000Z',
  })
  const attemptProjection = projectGiftCodeAttemptSummary({
    attemptId: 'attempt-1',
    requestId: 'request-1',
    ordinal: 1,
    outcome: 'provider_not_sent',
    resultCode: 'provider_not_sent',
    startedAt: '2026-07-17T12:00:00.000Z',
    completedAt: '2026-07-17T12:00:01.000Z',
  })
  const contextProjection = projectGiftCodeEligibilityContext({
    characterRef: 'character-ref-1',
    characterDisplayName: 'Governor',
    characterAvatarUrl: null,
    providerId: 'official-kingshot',
    providerAvailable: false,
    consentValid: false,
    eligible: false,
    reasons: ['feature_disabled'],
  })

  const serialized = JSON.stringify({
    historyProjection,
    detailProjection,
    attemptProjection,
    contextProjection,
  })
  for (const prohibited of [
    'playerId',
    'signature',
    'cookie',
    'leaseOwner',
    'supportNotes',
    'providerPayload',
  ]) {
    assert.equal(serialized.includes(prohibited), false)
  }
  assert.equal(detailProjection.retryAvailable, true)
})
test('support capabilities cannot forge success or retry ambiguity', () => {
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
    now: '2026-07-17T12:00:00.000Z',
  })
  assert.equal(created.accepted, true)
  if (!created.accepted) return

  const retryCapability = new Set<GiftCodeServerCapability>([
    'giftcode.retry.bounded.approve',
  ])
  assert.deepEqual(
    evaluateGiftCodeSupportAction({
      action: 'approve_bounded_retry',
      actorCapabilities: retryCapability,
      request: { ...created.request, status: 'ambiguous' },
    }).code,
    'support_action_forbidden',
  )
  assert.equal(
    evaluateGiftCodeSupportAction({
      action: 'enable_provider',
      actorCapabilities: retryCapability,
    }).allowed,
    false,
  )
  assert.equal(
    GIFT_CODE_API_CONTRACTS.some((contract) =>
      contract.id.includes('success'),
    ),
    false,
  )
})

test('API contracts are non-executable, bearer protected, and strict', () => {
  assert.ok(
    GIFT_CODE_API_CONTRACTS.every(
      (contract) => contract.executable === false,
    ),
  )
  assert.ok(
    GIFT_CODE_API_CONTRACTS
      .filter((contract) => contract.authentication !== 'internal')
      .every((contract) => contract.authentication === 'bearer'),
  )
  assert.deepEqual(
    parseStrictGiftCodeBody({
      value: {
        characterRef: 'character-ref-1',
        codePublicationRef: 'publication-ref-1',
        unexpected: true,
      },
      requiredFields: ['characterRef', 'codePublicationRef'],
    }),
    {
      ok: false,
      code: 'request_conflict',
      unknownFields: ['unexpected'],
      missingFields: [],
    },
  )
})
