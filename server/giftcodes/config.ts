import type {
  GiftCodeProviderDefinition,
  GiftCodeRedemptionProvider,
} from './provider.ts'

export const GIFT_CODE_REDEMPTION_FLAG =
  'GIFTCODE_REDEMPTION_ENABLED'

export const GIFT_CODE_OFFICIAL_PROVIDER_FLAG =
  'GIFTCODE_OFFICIAL_PROVIDER_ENABLED'

export const GIFT_CODE_APPROVED_ENVIRONMENT_FLAG =
  'GIFTCODE_PROVIDER_ENVIRONMENT_APPROVED'

export const GIFT_CODE_QUEUE_PROCESSING_FLAG =
  'GIFTCODE_QUEUE_PROCESSING_ENABLED'

export type GiftCodeRedemptionConfig = {
  enabled: boolean
}

export type GiftCodeFeatureGates = Readonly<{
  redemptionEnabled: boolean
  officialProviderEnabled: boolean
  approvedEnvironment: boolean
  queueProcessingEnabled: boolean
}>

export type GiftCodeProviderGateReason =
  | 'redemption_disabled'
  | 'official_provider_disabled'
  | 'environment_not_approved'
  | 'queue_processing_disabled'

export type GiftCodeProviderGateDecision = Readonly<{
  allowed: boolean
  reasons: readonly GiftCodeProviderGateReason[]
}>

export type GiftCodeProviderGateEvaluator = (
  definition: GiftCodeProviderDefinition,
) => GiftCodeProviderGateDecision

function isEnabled(
  environment: NodeJS.ProcessEnv,
  name: string,
) {
  return environment[name] === 'true'
}

export function readGiftCodeFeatureGates(
  environment: NodeJS.ProcessEnv = process.env,
): GiftCodeFeatureGates {
  return Object.freeze({
    redemptionEnabled: isEnabled(
      environment,
      GIFT_CODE_REDEMPTION_FLAG,
    ),
    officialProviderEnabled: isEnabled(
      environment,
      GIFT_CODE_OFFICIAL_PROVIDER_FLAG,
    ),
    approvedEnvironment: isEnabled(
      environment,
      GIFT_CODE_APPROVED_ENVIRONMENT_FLAG,
    ),
    queueProcessingEnabled: isEnabled(
      environment,
      GIFT_CODE_QUEUE_PROCESSING_FLAG,
    ),
  })
}

export function readGiftCodeRedemptionConfig(
  environment: NodeJS.ProcessEnv = process.env,
): GiftCodeRedemptionConfig {
  return {
    enabled: readGiftCodeFeatureGates(environment)
      .redemptionEnabled,
  }
}

export function evaluateGiftCodeProviderGates(
  gates: GiftCodeFeatureGates,
  definition: GiftCodeProviderDefinition,
): GiftCodeProviderGateDecision {
  if (
    definition.capabilities.executionMode ===
    'simulation'
  ) {
    return Object.freeze({
      allowed: true,
      reasons: Object.freeze([]),
    })
  }

  const reasons: GiftCodeProviderGateReason[] = []

  if (!gates.redemptionEnabled) {
    reasons.push('redemption_disabled')
  }

  if (!gates.officialProviderEnabled) {
    reasons.push('official_provider_disabled')
  }

  if (!gates.approvedEnvironment) {
    reasons.push('environment_not_approved')
  }

  if (!gates.queueProcessingEnabled) {
    reasons.push('queue_processing_disabled')
  }

  return Object.freeze({
    allowed: reasons.length === 0,
    reasons: Object.freeze(reasons),
  })
}

export function createGiftCodeProviderGateEvaluator(
  gates: GiftCodeFeatureGates,
): GiftCodeProviderGateEvaluator {
  return (definition) =>
    evaluateGiftCodeProviderGates(gates, definition)
}

export function assertProviderCanRun(
  gates: GiftCodeFeatureGates,
  provider: GiftCodeRedemptionProvider,
) {
  if (!gates.redemptionEnabled) {
    throw new Error('Gift-code redemption is disabled.')
  }

  if (
    provider.capabilities.executionMode === 'external' &&
    !gates.officialProviderEnabled
  ) {
    throw new Error(
      'The official gift-code provider is disabled.',
    )
  }

  if (
    provider.capabilities.executionMode === 'external' &&
    !gates.approvedEnvironment
  ) {
    throw new Error(
      'The gift-code provider environment is not approved.',
    )
  }

  if (!gates.queueProcessingEnabled) {
    throw new Error(
      'Gift-code queue processing is disabled.',
    )
  }

  if (!provider.productionReady) {
    throw new Error(
      'A non-production provider cannot run as a production redemption provider.',
    )
  }

  if (
    provider.capabilities.redemptionSupport !== 'live' ||
    !provider.capabilities.externalRequestsAllowed
  ) {
    throw new Error(
      'The selected provider does not support live external redemption.',
    )
  }
}
