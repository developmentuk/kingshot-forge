import type { GiftCodeResultCode } from './resultCodes.ts'

export const GIFT_CODE_REDEMPTION_REQUEST_STATES = [
  'requested',
  'queued',
  'processing',
  'succeeded',
  'already_claimed',
  'failed_retryable',
  'failed_terminal',
  'ambiguous',
  'cancelled',
  'expired',
  'withdrawn',
] as const

export type GiftCodeRedemptionRequestState =
  (typeof GIFT_CODE_REDEMPTION_REQUEST_STATES)[number]

export const GIFT_CODE_REDEMPTION_ATTEMPT_OUTCOMES = [
  'not_started',
  'simulated',
  'provider_success',
  'provider_already_claimed',
  'provider_terminal_failure',
  'provider_retryable_failure',
  'provider_ambiguous',
  'provider_not_sent',
  'cancelled',
  'lease_expired',
] as const

export type GiftCodeRedemptionAttemptOutcome =
  (typeof GIFT_CODE_REDEMPTION_ATTEMPT_OUTCOMES)[number]

export type GiftCodeRequestSnapshot = Readonly<{
  requestId: string
  userId: string
  characterInternalId: string
  characterRevision: number
  consentId: string
  providerId: string
  environment: string
  operation: 'redeem'
  codePublicationId: string
  publicationVersion: string
  idempotencyVersion: 'giftcode-redemption:v2'
  idempotencyHash: string
  status: GiftCodeRedemptionRequestState
  resultCode: GiftCodeResultCode
  completedAttempts: number
  maximumAttempts: 3
  optimisticVersion: number
  securityHoldActive: boolean
  nextAttemptAt: string | null
  createdAt: string
  updatedAt: string
  terminalAt: string | null
}>

export type GiftCodeRequestCreationResult =
  | Readonly<{
      accepted: true
      code: 'request_accepted'
      request: GiftCodeRequestSnapshot
    }>
  | Readonly<{
      accepted: false
      code: GiftCodeResultCode
      field: string | null
    }>

export type GiftCodeRequestTransitionResult =
  | Readonly<{
      transitioned: true
      code: GiftCodeResultCode
      request: GiftCodeRequestSnapshot
    }>
  | Readonly<{
      transitioned: false
      code: 'request_conflict' | 'stale_version' | 'security_hold'
      request: GiftCodeRequestSnapshot
    }>

export type GiftCodeRedemptionAttempt = Readonly<{
  attemptId: string
  requestId: string
  ordinal: number
  outcome: GiftCodeRedemptionAttemptOutcome
  requestDisposition: 'not_sent' | 'sent' | 'unknown'
  resultCode: GiftCodeResultCode
  safeDiagnosticCode: string | null
  startedAt: string
  completedAt: string | null
  version: 0 | 1
}>

export type GiftCodeAttemptFinalizationResult =
  | Readonly<{
      finalized: true
      attempt: GiftCodeRedemptionAttempt
    }>
  | Readonly<{
      finalized: false
      code: 'request_conflict' | 'stale_version'
      attempt: GiftCodeRedemptionAttempt
    }>

const TERMINAL_REQUEST_STATES = new Set<GiftCodeRedemptionRequestState>([
  'succeeded',
  'already_claimed',
  'failed_terminal',
  'ambiguous',
  'cancelled',
  'expired',
  'withdrawn',
])

const ALLOWED_REQUEST_TRANSITIONS: Readonly<
  Record<GiftCodeRedemptionRequestState, readonly GiftCodeRedemptionRequestState[]>
> = Object.freeze({
  requested: [
    'queued',
    'cancelled',
    'expired',
    'withdrawn',
  ] as const,
  queued: [
    'processing',
    'cancelled',
    'expired',
    'withdrawn',
  ] as const,
  processing: [
    'succeeded',
    'already_claimed',
    'failed_retryable',
    'failed_terminal',
    'ambiguous',
    'expired',
    'withdrawn',
  ] as const,
  failed_retryable: [
    'queued',
    'cancelled',
    'expired',
    'withdrawn',
  ] as const,
  succeeded: [] as const,
  already_claimed: [] as const,
  failed_terminal: [] as const,
  ambiguous: [] as const,
  cancelled: [] as const,
  expired: [] as const,
  withdrawn: [] as const,
})

function isUtcTimestamp(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(
      value,
    ) && !Number.isNaN(Date.parse(value))
  )
}

function hasText(value: string) {
  return value.trim().length > 0
}

function expectedResultCode(
  target: GiftCodeRedemptionRequestState,
): GiftCodeResultCode | null {
  const codes: Partial<
    Record<GiftCodeRedemptionRequestState, GiftCodeResultCode>
  > = {
    requested: 'request_accepted',
    queued: 'request_accepted',
    processing: 'request_accepted',
    succeeded: 'provider_success',
    already_claimed: 'already_claimed',
    ambiguous: 'provider_ambiguous',
    cancelled: 'request_cancelled',
    expired: 'request_expired',
    withdrawn: 'request_withdrawn',
  }

  return codes[target] ?? null
}

export function createGiftCodeRedemptionRequest(input: {
  requestId: string
  userId: string
  characterInternalId: string
  characterRevision: number
  consentId: string
  providerId: string
  environment: string
  codePublicationId: string
  publicationVersion: string
  idempotencyHash: string
  eligibilityCode: GiftCodeResultCode
  now: string
}): GiftCodeRequestCreationResult {
  if (input.eligibilityCode !== 'eligibility_confirmed') {
    return Object.freeze({
      accepted: false,
      code: input.eligibilityCode,
      field: null,
    })
  }

  const fields: ReadonlyArray<readonly [string, string]> = [
    ['requestId', input.requestId],
    ['userId', input.userId],
    ['characterInternalId', input.characterInternalId],
    ['consentId', input.consentId],
    ['providerId', input.providerId],
    ['environment', input.environment],
    ['codePublicationId', input.codePublicationId],
    ['publicationVersion', input.publicationVersion],
  ]

  for (const [field, value] of fields) {
    if (!hasText(value)) {
      return Object.freeze({
        accepted: false,
        code: 'request_conflict',
        field,
      })
    }
  }

  if (
    !Number.isInteger(input.characterRevision) ||
    input.characterRevision < 1
  ) {
    return Object.freeze({
      accepted: false,
      code: 'request_conflict',
      field: 'characterRevision',
    })
  }

  if (!/^[a-f0-9]{64}$/.test(input.idempotencyHash)) {
    return Object.freeze({
      accepted: false,
      code: 'request_conflict',
      field: 'idempotencyHash',
    })
  }

  if (!isUtcTimestamp(input.now)) {
    return Object.freeze({
      accepted: false,
      code: 'request_conflict',
      field: 'now',
    })
  }

  return Object.freeze({
    accepted: true,
    code: 'request_accepted',
    request: Object.freeze({
      requestId: input.requestId.trim(),
      userId: input.userId.trim(),
      characterInternalId: input.characterInternalId.trim(),
      characterRevision: input.characterRevision,
      consentId: input.consentId.trim(),
      providerId: input.providerId.trim(),
      environment: input.environment.trim(),
      operation: 'redeem',
      codePublicationId: input.codePublicationId.trim(),
      publicationVersion: input.publicationVersion.trim(),
      idempotencyVersion: 'giftcode-redemption:v2',
      idempotencyHash: input.idempotencyHash,
      status: 'requested',
      resultCode: 'request_accepted',
      completedAttempts: 0,
      maximumAttempts: 3,
      optimisticVersion: 1,
      securityHoldActive: false,
      nextAttemptAt: null,
      createdAt: input.now,
      updatedAt: input.now,
      terminalAt: null,
    }),
  })
}

export function transitionGiftCodeRedemptionRequest(input: {
  request: GiftCodeRequestSnapshot
  expectedVersion: number
  target: GiftCodeRedemptionRequestState
  resultCode: GiftCodeResultCode
  now: string
  nextAttemptAt?: string | null
}): GiftCodeRequestTransitionResult {
  if (input.expectedVersion !== input.request.optimisticVersion) {
    return Object.freeze({
      transitioned: false,
      code: 'stale_version',
      request: input.request,
    })
  }

  if (
    input.request.securityHoldActive &&
    (input.target === 'queued' || input.target === 'processing')
  ) {
    return Object.freeze({
      transitioned: false,
      code: 'security_hold',
      request: input.request,
    })
  }

  if (
    !isUtcTimestamp(input.now) ||
    !ALLOWED_REQUEST_TRANSITIONS[input.request.status].includes(
      input.target,
    )
  ) {
    return Object.freeze({
      transitioned: false,
      code: 'request_conflict',
      request: input.request,
    })
  }

  const requiredCode = expectedResultCode(input.target)

  if (requiredCode !== null && input.resultCode !== requiredCode) {
    return Object.freeze({
      transitioned: false,
      code: 'request_conflict',
      request: input.request,
    })
  }

  if (
    input.target === 'failed_retryable' &&
    ![
      'provider_retryable_failure',
      'provider_not_sent',
      'rate_limited',
    ].includes(input.resultCode)
  ) {
    return Object.freeze({
      transitioned: false,
      code: 'request_conflict',
      request: input.request,
    })
  }

  if (
    input.target === 'failed_terminal' &&
    [
      'provider_success',
      'already_claimed',
      'provider_ambiguous',
      'provider_retryable_failure',
    ].includes(input.resultCode)
  ) {
    return Object.freeze({
      transitioned: false,
      code: 'request_conflict',
      request: input.request,
    })
  }

  const completedAttempts =
    input.target === 'processing'
      ? input.request.completedAttempts + 1
      : input.request.completedAttempts

  if (completedAttempts > input.request.maximumAttempts) {
    return Object.freeze({
      transitioned: false,
      code: 'request_conflict',
      request: input.request,
    })
  }

  const nextAttemptAt = input.nextAttemptAt ?? null

  if (
    (input.target === 'failed_retryable' || input.target === 'queued') &&
    nextAttemptAt !== null &&
    !isUtcTimestamp(nextAttemptAt)
  ) {
    return Object.freeze({
      transitioned: false,
      code: 'request_conflict',
      request: input.request,
    })
  }

  const terminalAt = TERMINAL_REQUEST_STATES.has(input.target)
    ? input.now
    : null
  const request = Object.freeze({
    ...input.request,
    status: input.target,
    resultCode: input.resultCode,
    completedAttempts,
    optimisticVersion: input.request.optimisticVersion + 1,
    nextAttemptAt:
      input.target === 'failed_retryable' || input.target === 'queued'
        ? nextAttemptAt
        : null,
    updatedAt: input.now,
    terminalAt,
  })

  return Object.freeze({
    transitioned: true,
    code: input.resultCode,
    request,
  })
}

export function setGiftCodeRequestSecurityHold(input: {
  request: GiftCodeRequestSnapshot
  expectedVersion: number
  active: boolean
  now: string
}): GiftCodeRequestTransitionResult {
  if (
    input.expectedVersion !== input.request.optimisticVersion ||
    !isUtcTimestamp(input.now)
  ) {
    return Object.freeze({
      transitioned: false,
      code:
        input.expectedVersion !== input.request.optimisticVersion
          ? 'stale_version'
          : 'request_conflict',
      request: input.request,
    })
  }

  const request = Object.freeze({
    ...input.request,
    securityHoldActive: input.active,
    optimisticVersion: input.request.optimisticVersion + 1,
    updatedAt: input.now,
  })

  return Object.freeze({
    transitioned: true,
    code: input.active ? 'security_hold' : input.request.resultCode,
    request,
  })
}

export function createGiftCodeRedemptionAttempt(input: {
  attemptId: string
  requestId: string
  ordinal: number
  startedAt: string
}): GiftCodeRedemptionAttempt | null {
  if (
    !hasText(input.attemptId) ||
    !hasText(input.requestId) ||
    !Number.isInteger(input.ordinal) ||
    input.ordinal < 1 ||
    input.ordinal > 3 ||
    !isUtcTimestamp(input.startedAt)
  ) {
    return null
  }

  return Object.freeze({
    attemptId: input.attemptId.trim(),
    requestId: input.requestId.trim(),
    ordinal: input.ordinal,
    outcome: 'not_started',
    requestDisposition: 'not_sent',
    resultCode: 'provider_not_sent',
    safeDiagnosticCode: null,
    startedAt: input.startedAt,
    completedAt: null,
    version: 0,
  })
}

export function finalizeGiftCodeRedemptionAttempt(input: {
  attempt: GiftCodeRedemptionAttempt
  expectedVersion: 0 | 1
  outcome: Exclude<GiftCodeRedemptionAttemptOutcome, 'not_started'>
  requestDisposition: 'not_sent' | 'sent' | 'unknown'
  resultCode: GiftCodeResultCode
  safeDiagnosticCode: string
  completedAt: string
  classificationEvidence:
    | 'validated_provider_response'
    | 'simulation'
    | 'local_control'
}): GiftCodeAttemptFinalizationResult {
  if (input.expectedVersion !== input.attempt.version) {
    return Object.freeze({
      finalized: false,
      code: 'stale_version',
      attempt: input.attempt,
    })
  }

  if (
    input.attempt.outcome !== 'not_started' ||
    input.attempt.version !== 0 ||
    !hasText(input.safeDiagnosticCode) ||
    !isUtcTimestamp(input.completedAt)
  ) {
    return Object.freeze({
      finalized: false,
      code: 'request_conflict',
      attempt: input.attempt,
    })
  }

  const confirmedProviderOutcome =
    input.outcome === 'provider_success' ||
    input.outcome === 'provider_already_claimed'

  if (
    confirmedProviderOutcome &&
    input.classificationEvidence !== 'validated_provider_response'
  ) {
    return Object.freeze({
      finalized: false,
      code: 'request_conflict',
      attempt: input.attempt,
    })
  }

  if (
    input.outcome === 'simulated' &&
    (input.classificationEvidence !== 'simulation' ||
      input.requestDisposition !== 'not_sent' ||
      input.resultCode !== 'simulation_only')
  ) {
    return Object.freeze({
      finalized: false,
      code: 'request_conflict',
      attempt: input.attempt,
    })
  }

  if (
    input.outcome === 'provider_ambiguous' &&
    input.requestDisposition === 'not_sent'
  ) {
    return Object.freeze({
      finalized: false,
      code: 'request_conflict',
      attempt: input.attempt,
    })
  }

  if (
    input.outcome === 'provider_retryable_failure' &&
    input.requestDisposition !== 'not_sent'
  ) {
    return Object.freeze({
      finalized: false,
      code: 'request_conflict',
      attempt: input.attempt,
    })
  }

  return Object.freeze({
    finalized: true,
    attempt: Object.freeze({
      ...input.attempt,
      outcome: input.outcome,
      requestDisposition: input.requestDisposition,
      resultCode: input.resultCode,
      safeDiagnosticCode: input.safeDiagnosticCode.trim(),
      completedAt: input.completedAt,
      version: 1,
    }),
  })
}
