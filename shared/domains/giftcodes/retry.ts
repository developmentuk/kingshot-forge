import type { GiftCodeResultCode } from './resultCodes.ts'

export const GIFT_CODE_MAXIMUM_ATTEMPTS = 3 as const
export const GIFT_CODE_RETRY_DELAYS_SECONDS = [30, 120] as const
export const GIFT_CODE_MAXIMUM_JITTER_FRACTION = 0.2 as const
export const GIFT_CODE_TRANSPORT_RETRIES_ALLOWED = false as const

export type GiftCodeRetryClock = Readonly<{
  now: () => Date
}>

export type GiftCodeRetryJitter = Readonly<{
  fraction: () => number
}>

export type GiftCodeRetryDecision = Readonly<{
  shouldRetry: boolean
  code: GiftCodeResultCode
  delaySeconds: number | null
  retryAt: string | null
  remainingAttempts: number
  transportRetryAllowed: false
}>

const RETRYABLE_CODES = new Set<GiftCodeResultCode>([
  'provider_retryable_failure',
  'provider_not_sent',
  'rate_limited',
])

export function getGiftCodeRetryDecision(input: {
  completedAttempts: number
  resultCode: GiftCodeResultCode
  requestDisposition: 'not_sent' | 'sent' | 'unknown'
  retryAfterSeconds?: number | null
  clock: GiftCodeRetryClock
  jitter: GiftCodeRetryJitter
}): GiftCodeRetryDecision {
  const remainingAttempts = Math.max(
    0,
    GIFT_CODE_MAXIMUM_ATTEMPTS - input.completedAttempts,
  )
  const safeToRetry =
    Number.isInteger(input.completedAttempts) &&
    input.completedAttempts >= 1 &&
    input.completedAttempts < GIFT_CODE_MAXIMUM_ATTEMPTS &&
    RETRYABLE_CODES.has(input.resultCode) &&
    input.requestDisposition === 'not_sent'

  if (!safeToRetry) {
    return Object.freeze({
      shouldRetry: false,
      code:
        remainingAttempts === 0
          ? 'retry_budget_exhausted'
          : input.resultCode,
      delaySeconds: null,
      retryAt: null,
      remainingAttempts,
      transportRetryAllowed: GIFT_CODE_TRANSPORT_RETRIES_ALLOWED,
    })
  }

  const baseDelay =
    GIFT_CODE_RETRY_DELAYS_SECONDS[input.completedAttempts - 1]
  const jitterFraction = input.jitter.fraction()

  if (
    baseDelay === undefined ||
    !Number.isFinite(jitterFraction) ||
    jitterFraction < -1 ||
    jitterFraction > 1
  ) {
    return Object.freeze({
      shouldRetry: false,
      code: 'request_conflict',
      delaySeconds: null,
      retryAt: null,
      remainingAttempts,
      transportRetryAllowed: GIFT_CODE_TRANSPORT_RETRIES_ALLOWED,
    })
  }

  const jitteredDelay = Math.round(
    baseDelay *
      (1 + jitterFraction * GIFT_CODE_MAXIMUM_JITTER_FRACTION),
  )
  const providerMinimum = Math.max(
    0,
    Math.floor(input.retryAfterSeconds ?? 0),
  )
  const delaySeconds = Math.max(jitteredDelay, providerMinimum)
  const retryAt = new Date(
    input.clock.now().getTime() + delaySeconds * 1000,
  ).toISOString()

  return Object.freeze({
    shouldRetry: true,
    code: input.resultCode,
    delaySeconds,
    retryAt,
    remainingAttempts,
    transportRetryAllowed: GIFT_CODE_TRANSPORT_RETRIES_ALLOWED,
  })
}
