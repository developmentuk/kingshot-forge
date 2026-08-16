export const GIFT_CODE_CONSENT_VERSION =
  'giftcode-redemption-v2'

export const VERIFIED_PLAYER_STATUSES = [
  'officially_verified',
] as const

export type VerifiedPlayerStatus =
  (typeof VERIFIED_PLAYER_STATUSES)[number]

export type GiftCodeAvailability =
  | 'active'
  | 'expired'
  | 'unknown'

export type RedemptionEligibilityReason =
  | 'feature_disabled'
  | 'authentication_required'
  | 'player_required'
  | 'player_verification_required'
  | 'consent_required'
  | 'consent_version_mismatch'
  | 'code_expired'
  | 'code_status_unknown'

export type RedemptionConsent = {
  enabled: boolean
  version: string
}

export type RedemptionEligibilityInput = {
  featureEnabled: boolean
  authenticated: boolean
  playerAccountId: string | null
  verificationStatus: string | null
  consent: RedemptionConsent | null
  codeAvailability: GiftCodeAvailability
}

export type RedemptionEligibility =
  | {
      eligible: true
      reasons: []
    }
  | {
      eligible: false
      reasons: RedemptionEligibilityReason[]
    }

export type RedemptionOutcomeStatus =
  | 'pending'
  | 'succeeded'
  | 'already_claimed'
  | 'expired'
  | 'failed'
  | 'not_supported'
  | 'simulation_only'

export type RedemptionFailureCategory =
  | 'transient_provider'
  | 'rate_limited'
  | 'permanent'
  | 'invalid_request'

export type RetryDecision = {
  shouldRetry: boolean
  delaySeconds: number | null
}

const RETRY_DELAYS_SECONDS = [30, 120] as const

export function isVerifiedPlayerStatus(
  status: string | null,
): status is VerifiedPlayerStatus {
  return VERIFIED_PLAYER_STATUSES.some(
    (verifiedStatus) => verifiedStatus === status,
  )
}

export function evaluateRedemptionEligibility(
  input: RedemptionEligibilityInput,
): RedemptionEligibility {
  const reasons: RedemptionEligibilityReason[] = []

  if (!input.featureEnabled) {
    reasons.push('feature_disabled')
  }

  if (!input.authenticated) {
    reasons.push('authentication_required')
  }

  if (!input.playerAccountId) {
    reasons.push('player_required')
  }

  if (!isVerifiedPlayerStatus(input.verificationStatus)) {
    reasons.push('player_verification_required')
  }

  if (!input.consent?.enabled) {
    reasons.push('consent_required')
  } else if (
    input.consent.version !== GIFT_CODE_CONSENT_VERSION
  ) {
    reasons.push('consent_version_mismatch')
  }

  if (input.codeAvailability === 'expired') {
    reasons.push('code_expired')
  } else if (input.codeAvailability === 'unknown') {
    reasons.push('code_status_unknown')
  }

  if (reasons.length > 0) {
    return {
      eligible: false,
      reasons,
    }
  }

  return {
    eligible: true,
    reasons: [],
  }
}

export function normaliseGiftCodeInput(value: string) {
  const normalised = value.trim()

  if (
    normalised.length < 3 ||
    normalised.length > 64 ||
    !/^[A-Za-z0-9_-]+$/.test(normalised)
  ) {
    throw new Error('Gift code format is invalid.')
  }

  return normalised
}

export function createRedemptionIdempotencyMaterial(input: {
  playerAccountId: string
  giftCodeId: string
  giftCodeVersion: string
}) {
  const values = [
    input.playerAccountId,
    input.giftCodeId,
    input.giftCodeVersion,
  ].map((value) => value.trim())

  if (values.some((value) => value.length === 0)) {
    throw new Error(
      'Idempotency material requires stable record identifiers.',
    )
  }

  return ['giftcode-redemption', 'v1', ...values].join('|')
}

export function getRetryDecision(
  category: RedemptionFailureCategory,
  completedAttempts: number,
): RetryDecision {
  if (!Number.isInteger(completedAttempts) || completedAttempts < 1) {
    throw new Error(
      'Completed attempts must be a positive integer.',
    )
  }

  if (
    category === 'permanent' ||
    category === 'invalid_request' ||
    completedAttempts > RETRY_DELAYS_SECONDS.length
  ) {
    return {
      shouldRetry: false,
      delaySeconds: null,
    }
  }

  const baseDelay =
    RETRY_DELAYS_SECONDS[completedAttempts - 1]

  return {
    shouldRetry: true,
    delaySeconds:
      category === 'rate_limited'
        ? Math.max(60, baseDelay)
        : baseDelay,
  }
}
