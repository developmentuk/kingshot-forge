import type { GiftCodeResultCode } from './resultCodes.ts'

export const GIFT_CODE_CONSENT_PURPOSE =
  'official_gift_code_redemption'

export const GIFT_CODE_CONSENT_MODES = [
  'single_code',
  'automatic_selection',
] as const

export type GiftCodeConsentMode =
  (typeof GIFT_CODE_CONSENT_MODES)[number]

export type GiftCodeRedemptionConsent = Readonly<{
  consentId: string
  policyVersion: string
  policyDigest: string
  purpose: typeof GIFT_CODE_CONSENT_PURPOSE
  userId: string
  characterInternalId: string
  characterRevision: number
  providerId: string
  providerMode: GiftCodeConsentMode
  environment: string
  grantedAt: string
  revokedAt: string | null
  expiresAt: string | null
  evidenceVersion: string
  evidenceMetadata: Readonly<Record<string, string | boolean | null>>
}>

export type GiftCodeConsentValidationContext = Readonly<{
  now: string
  expectedPolicyVersion: string
  expectedPolicyDigest: string
  userId: string
  characterInternalId: string
  characterRevision: number
  providerId: string
  providerMode: GiftCodeConsentMode
  environment: string
}>

export type GiftCodeConsentDecision =
  | Readonly<{
      valid: true
      code: 'eligibility_confirmed'
    }>
  | Readonly<{
      valid: false
      code: GiftCodeResultCode
    }>

export type GiftCodeConsentCreationResult =
  | Readonly<{
      ok: true
      consent: GiftCodeRedemptionConsent
    }>
  | Readonly<{
      ok: false
      code: 'invalid_consent_contract'
      field: string
    }>

const POLICY_DIGEST = /^[a-f0-9]{64}$/
const EVIDENCE_KEY = /^[a-z][a-z0-9_]*$/
const SENSITIVE_EVIDENCE_KEY =
  /secret|signature|cookie|token|authorization|password|payload|raw|player.?id|gift.?code/i

function hasText(value: string) {
  return value.trim().length > 0
}
function isUtcTimestamp(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(
      value,
    ) && !Number.isNaN(Date.parse(value))
  )
}

function freezeEvidence(
  evidence: GiftCodeRedemptionConsent['evidenceMetadata'],
) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(evidence).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  )
}

export function createGiftCodeRedemptionConsent(
  input: GiftCodeRedemptionConsent,
): GiftCodeConsentCreationResult {
  const requiredText: ReadonlyArray<readonly [string, string]> = [
    ['consentId', input.consentId],
    ['policyVersion', input.policyVersion],
    ['userId', input.userId],
    ['characterInternalId', input.characterInternalId],
    ['providerId', input.providerId],
    ['environment', input.environment],
    ['evidenceVersion', input.evidenceVersion],
  ]

  for (const [field, value] of requiredText) {
    if (!hasText(value)) {
      return Object.freeze({
        ok: false,
        code: 'invalid_consent_contract',
        field,
      })
    }
  }

  if (!POLICY_DIGEST.test(input.policyDigest)) {
    return Object.freeze({
      ok: false,
      code: 'invalid_consent_contract',
      field: 'policyDigest',
    })
  }

  if (
    !Number.isInteger(input.characterRevision) ||
    input.characterRevision < 1
  ) {
    return Object.freeze({
      ok: false,
      code: 'invalid_consent_contract',
      field: 'characterRevision',
    })
  }

  if (!isUtcTimestamp(input.grantedAt)) {
    return Object.freeze({
      ok: false,
      code: 'invalid_consent_contract',
      field: 'grantedAt',
    })
  }

  for (const [field, value] of [
    ['revokedAt', input.revokedAt],
    ['expiresAt', input.expiresAt],
  ] as const) {
    if (value !== null && !isUtcTimestamp(value)) {
      return Object.freeze({
        ok: false,
        code: 'invalid_consent_contract',
        field,
      })
    }

    if (
      value !== null &&
      Date.parse(value) < Date.parse(input.grantedAt)
    ) {
      return Object.freeze({
        ok: false,
        code: 'invalid_consent_contract',
        field,
      })
    }
  }

  for (const key of Object.keys(input.evidenceMetadata)) {
    if (
      !EVIDENCE_KEY.test(key) ||
      SENSITIVE_EVIDENCE_KEY.test(key)
    ) {
      return Object.freeze({
        ok: false,
        code: 'invalid_consent_contract',
        field: `evidenceMetadata.${key}`,
      })
    }
  }

  return Object.freeze({
    ok: true,
    consent: Object.freeze({
      ...input,
      consentId: input.consentId.trim(),
      policyVersion: input.policyVersion.trim(),
      userId: input.userId.trim(),
      characterInternalId: input.characterInternalId.trim(),
      providerId: input.providerId.trim(),
      environment: input.environment.trim(),
      evidenceVersion: input.evidenceVersion.trim(),
      evidenceMetadata: freezeEvidence(input.evidenceMetadata),
    }),
  })
}

export function evaluateGiftCodeConsent(
  consent: GiftCodeRedemptionConsent | null,
  context: GiftCodeConsentValidationContext,
): GiftCodeConsentDecision {
  if (consent === null) {
    return Object.freeze({ valid: false, code: 'consent_required' })
  }

  if (consent.revokedAt !== null) {
    return Object.freeze({ valid: false, code: 'consent_revoked' })
  }

  if (
    consent.expiresAt !== null &&
    Date.parse(consent.expiresAt) <= Date.parse(context.now)
  ) {
    return Object.freeze({ valid: false, code: 'consent_expired' })
  }

  if (consent.userId !== context.userId) {
    return Object.freeze({ valid: false, code: 'consent_user_mismatch' })
  }

  if (
    consent.characterInternalId !== context.characterInternalId ||
    consent.characterRevision !== context.characterRevision
  ) {
    return Object.freeze({
      valid: false,
      code: 'consent_character_mismatch',
    })
  }

  if (consent.providerId !== context.providerId) {
    return Object.freeze({
      valid: false,
      code: 'consent_provider_mismatch',
    })
  }

  if (consent.providerMode !== context.providerMode) {
    return Object.freeze({
      valid: false,
      code: 'consent_mode_mismatch',
    })
  }

  if (consent.environment !== context.environment) {
    return Object.freeze({
      valid: false,
      code: 'consent_environment_mismatch',
    })
  }

  if (consent.policyVersion !== context.expectedPolicyVersion) {
    return Object.freeze({
      valid: false,
      code: 'consent_policy_mismatch',
    })
  }

  if (consent.policyDigest !== context.expectedPolicyDigest) {
    return Object.freeze({
      valid: false,
      code: 'consent_digest_mismatch',
    })
  }

  return Object.freeze({
    valid: true,
    code: 'eligibility_confirmed',
  })
}
