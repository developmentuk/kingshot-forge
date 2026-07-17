export const GIFT_CODE_PROVIDER_CIRCUIT_STATES = [
  'closed',
  'open',
  'half_open',
] as const

export type GiftCodeProviderCircuitState =
  (typeof GIFT_CODE_PROVIDER_CIRCUIT_STATES)[number]

export const GIFT_CODE_PROVIDER_HEALTH_STATUSES = [
  'disabled',
  'unknown',
  'healthy',
  'degraded',
  'unhealthy',
  'critical',
] as const

export type GiftCodeProviderHealthStatus =
  (typeof GIFT_CODE_PROVIDER_HEALTH_STATUSES)[number]

export type GiftCodeProviderHealthReason =
  | 'provider_disabled'
  | 'insufficient_data'
  | 'circuit_open'
  | 'circuit_half_open'
  | 'elevated_failure_rate'
  | 'ambiguous_outcomes_present'
  | 'provider_rate_limited'
  | 'high_latency'
  | 'queue_backlog'

export type GiftCodeProviderHealthWindow = Readonly<{
  providerEnabled: boolean
  circuitState: GiftCodeProviderCircuitState
  successful: number
  terminalFailures: number
  transientFailures: number
  ambiguous: number
  rateLimited: number
  p95LatencyMs: number
  oldestQueueAgeSeconds: number
}>

export type GiftCodeProviderHealthAssessment = Readonly<{
  status: GiftCodeProviderHealthStatus
  score: number | null
  sampleSize: number
  reasons: readonly GiftCodeProviderHealthReason[]
}>

function requireNonNegativeInteger(
  value: number,
  label: string,
) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `${label} must be a non-negative integer.`,
    )
  }

  return value
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function statusForScore(
  score: number,
): GiftCodeProviderHealthStatus {
  if (score >= 85) {
    return 'healthy'
  }

  if (score >= 65) {
    return 'degraded'
  }

  if (score >= 40) {
    return 'unhealthy'
  }

  return 'critical'
}

function freezeReasons(
  reasons: GiftCodeProviderHealthReason[],
) {
  return Object.freeze(reasons)
}

export function assessGiftCodeProviderHealth(
  window: GiftCodeProviderHealthWindow,
): GiftCodeProviderHealthAssessment {
  const successful = requireNonNegativeInteger(
    window.successful,
    'Successful outcome count',
  )
  const terminalFailures = requireNonNegativeInteger(
    window.terminalFailures,
    'Terminal failure count',
  )
  const transientFailures = requireNonNegativeInteger(
    window.transientFailures,
    'Transient failure count',
  )
  const ambiguous = requireNonNegativeInteger(
    window.ambiguous,
    'Ambiguous outcome count',
  )
  const rateLimited = requireNonNegativeInteger(
    window.rateLimited,
    'Rate-limit outcome count',
  )
  const p95LatencyMs = requireNonNegativeInteger(
    window.p95LatencyMs,
    'P95 latency',
  )
  const oldestQueueAgeSeconds = requireNonNegativeInteger(
    window.oldestQueueAgeSeconds,
    'Oldest queue age',
  )
  const sampleSize =
    successful +
    terminalFailures +
    transientFailures +
    ambiguous +
    rateLimited

  if (!window.providerEnabled) {
    return Object.freeze({
      status: 'disabled',
      score: null,
      sampleSize,
      reasons: freezeReasons(['provider_disabled']),
    })
  }

  if (window.circuitState === 'open') {
    return Object.freeze({
      status: 'critical',
      score: 0,
      sampleSize,
      reasons: freezeReasons(['circuit_open']),
    })
  }

  if (sampleSize === 0) {
    return Object.freeze({
      status: 'unknown',
      score: null,
      sampleSize,
      reasons: freezeReasons([
        ...(window.circuitState === 'half_open'
          ? ['circuit_half_open' as const]
          : []),
        'insufficient_data',
      ]),
    })
  }

  const totalFailures =
    terminalFailures +
    transientFailures +
    ambiguous +
    rateLimited
  const failureRate = totalFailures / sampleSize
  const ambiguityRate = ambiguous / sampleSize
  const rateLimitRate = rateLimited / sampleSize
  const latencyPenalty = clamp(
    ((p95LatencyMs - 1000) / 4000) * 10,
    0,
    10,
  )
  const queuePenalty = clamp(
    ((oldestQueueAgeSeconds - 60) / 540) * 10,
    0,
    10,
  )

  let score = Math.round(
    100 -
      failureRate * 40 -
      ambiguityRate * 35 -
      rateLimitRate * 15 -
      latencyPenalty -
      queuePenalty,
  )

  const reasons: GiftCodeProviderHealthReason[] = []

  if (window.circuitState === 'half_open') {
    score = Math.min(score, 40)
    reasons.push('circuit_half_open')
  }

  if (failureRate >= 0.1) {
    reasons.push('elevated_failure_rate')
  }

  if (ambiguous > 0) {
    reasons.push('ambiguous_outcomes_present')
  }

  if (rateLimited > 0) {
    reasons.push('provider_rate_limited')
  }

  if (p95LatencyMs > 2000) {
    reasons.push('high_latency')
  }

  if (oldestQueueAgeSeconds > 120) {
    reasons.push('queue_backlog')
  }

  const boundedScore = clamp(score, 0, 100)

  return Object.freeze({
    status: statusForScore(boundedScore),
    score: boundedScore,
    sampleSize,
    reasons: freezeReasons(reasons),
  })
}
