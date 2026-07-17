import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GIFT_CODE_CONSENT_PURPOSE,
  createGiftCodeRedemptionConsent,
  evaluateGiftCodeConsent,
  type GiftCodeRedemptionConsent,
} from './consent.ts'

const digest = 'a'.repeat(64)

const consent: GiftCodeRedemptionConsent = {
  consentId: 'consent-1',
  policyVersion: 'policy-v1',
  policyDigest: digest,
  purpose: GIFT_CODE_CONSENT_PURPOSE,
  userId: 'user-1',
  characterInternalId: 'character-1',
  characterRevision: 4,
  providerId: 'official-kingshot',
  providerMode: 'single_code',
  environment: 'test',
  grantedAt: '2026-07-17T12:00:00.000Z',
  revokedAt: null,
  expiresAt: '2026-08-17T12:00:00.000Z',
  evidenceVersion: 'surface-v1',
  evidenceMetadata: {
    locale: 'en-GB',
    confirmed: true,
  },
}

const context = {
  now: '2026-07-18T12:00:00.000Z',
  expectedPolicyVersion: 'policy-v1',
  expectedPolicyDigest: digest,
  userId: 'user-1',
  characterInternalId: 'character-1',
  characterRevision: 4,
  providerId: 'official-kingshot',
  providerMode: 'single_code' as const,
  environment: 'test',
}

test('consent is purpose-bound, deterministic, and immutable', () => {
  const created = createGiftCodeRedemptionConsent(consent)

  assert.equal(created.ok, true)
  if (!created.ok) return

  assert.equal(Object.isFrozen(created.consent), true)
  assert.equal(Object.isFrozen(created.consent.evidenceMetadata), true)
  assert.deepEqual(
    evaluateGiftCodeConsent(created.consent, context),
    { valid: true, code: 'eligibility_confirmed' },
  )
})
test('revocation and expiry immediately invalidate consent', () => {
  assert.deepEqual(
    evaluateGiftCodeConsent(
      {
        ...consent,
        revokedAt: '2026-07-18T11:00:00.000Z',
      },
      context,
    ),
    { valid: false, code: 'consent_revoked' },
  )
  assert.deepEqual(
    evaluateGiftCodeConsent(
      {
        ...consent,
        expiresAt: '2026-07-18T12:00:00.000Z',
      },
      context,
    ),
    { valid: false, code: 'consent_expired' },
  )
})

test('consent cannot cross user, character, provider, mode, or policy', () => {
  const variants = [
    [
      { ...context, userId: 'user-2' },
      'consent_user_mismatch',
    ],
    [
      { ...context, characterRevision: 5 },
      'consent_character_mismatch',
    ],
    [
      { ...context, providerId: 'future-provider' },
      'consent_provider_mismatch',
    ],
    [
      {
        ...context,
        providerMode: 'automatic_selection' as const,
      },
      'consent_mode_mismatch',
    ],
    [
      { ...context, expectedPolicyVersion: 'policy-v2' },
      'consent_policy_mismatch',
    ],
  ] as const

  for (const [variant, expectedCode] of variants) {
    assert.equal(
      evaluateGiftCodeConsent(consent, variant).code,
      expectedCode,
    )
  }
})

test('consent evidence rejects sensitive metadata', () => {
  const result = createGiftCodeRedemptionConsent({
    ...consent,
    evidenceMetadata: {
      provider_token: 'not-a-real-value',
    },
  })

  assert.deepEqual(result, {
    ok: false,
    code: 'invalid_consent_contract',
    field: 'evidenceMetadata.provider_token',
  })
})
