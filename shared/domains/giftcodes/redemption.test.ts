import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GIFT_CODE_CONSENT_VERSION,
  createRedemptionIdempotencyMaterial,
  evaluateRedemptionEligibility,
  getRetryDecision,
  normaliseGiftCodeInput,
} from './redemption.ts'

test('eligible redemption requires every safety precondition', () => {
  const result = evaluateRedemptionEligibility({
    featureEnabled: true,
    authenticated: true,
    playerAccountId: 'player-account-1',
    verificationStatus: 'officially_verified',
    consent: {
      enabled: true,
      version: GIFT_CODE_CONSENT_VERSION,
    },
    codeAvailability: 'active',
  })

  assert.deepEqual(result, {
    eligible: true,
    reasons: [],
  })
})

test('ineligible redemption reports all unmet preconditions', () => {
  const result = evaluateRedemptionEligibility({
    featureEnabled: false,
    authenticated: false,
    playerAccountId: null,
    verificationStatus: 'linked',
    consent: null,
    codeAvailability: 'unknown',
  })

  assert.deepEqual(result, {
    eligible: false,
    reasons: [
      'feature_disabled',
      'authentication_required',
      'player_required',
      'player_verification_required',
      'consent_required',
      'code_status_unknown',
    ],
  })
})

test('stale consent and expired codes remain ineligible', () => {
  const result = evaluateRedemptionEligibility({
    featureEnabled: true,
    authenticated: true,
    playerAccountId: 'player-account-1',
    verificationStatus: 'officially_verified',
    consent: {
      enabled: true,
      version: 'retired-consent-version',
    },
    codeAvailability: 'expired',
  })

  assert.deepEqual(result, {
    eligible: false,
    reasons: [
      'consent_version_mismatch',
      'code_expired',
    ],
  })
})

test('public lookup and community verification do not prove ownership', () => {
  for (const verificationStatus of ['verified', 'community_verified']) {
    const result = evaluateRedemptionEligibility({
      featureEnabled: true,
      authenticated: true,
      playerAccountId: 'player-account-1',
      verificationStatus,
      consent: {
        enabled: true,
        version: GIFT_CODE_CONSENT_VERSION,
      },
      codeAvailability: 'active',
    })

    assert.equal(result.eligible, false)
    assert.ok(result.reasons.includes('player_verification_required'))
  }
})

test('gift-code normalisation trims but preserves case', () => {
  assert.equal(
    normaliseGiftCodeInput('  Kingshot_2026-01  '),
    'Kingshot_2026-01',
  )
  assert.throws(
    () => normaliseGiftCodeInput('contains spaces'),
    /format is invalid/,
  )
  assert.throws(
    () => normaliseGiftCodeInput('ab'),
    /format is invalid/,
  )
})

test('idempotency material uses stable record identifiers', () => {
  assert.equal(
    createRedemptionIdempotencyMaterial({
      playerAccountId: 'account-1',
      giftCodeId: 'gift-code-4',
      giftCodeVersion: 'published-record-2',
    }),
    'giftcode-redemption|v1|account-1|gift-code-4|published-record-2',
  )

  assert.throws(
    () =>
      createRedemptionIdempotencyMaterial({
        playerAccountId: '',
        giftCodeId: 'gift-code-4',
        giftCodeVersion: 'published-record-2',
      }),
    /stable record identifiers/,
  )
})

test('retries are bounded and permanent failures never retry', () => {
  assert.deepEqual(
    getRetryDecision('transient_provider', 1),
    {
      shouldRetry: true,
      delaySeconds: 30,
    },
  )
  assert.deepEqual(getRetryDecision('rate_limited', 2), {
    shouldRetry: true,
    delaySeconds: 120,
  })
  assert.deepEqual(
    getRetryDecision('transient_provider', 3),
    {
      shouldRetry: false,
      delaySeconds: null,
    },
  )
  assert.deepEqual(getRetryDecision('permanent', 1), {
    shouldRetry: false,
    delaySeconds: null,
  })
})
