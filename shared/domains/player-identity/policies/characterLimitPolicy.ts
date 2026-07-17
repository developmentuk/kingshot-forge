export interface AdministrativeCharacterLimitOverride {
  readonly limit: number
  readonly reason: string
  readonly expiresAt?: string
}

export interface CharacterLimitConfiguration {
  readonly baseAccountLimit: number
  readonly entitlementAdjustment: number
  readonly allianceRoleAdjustment: number
  readonly subscriptionAdjustment: number
  readonly administrativeOverride?: AdministrativeCharacterLimitOverride
  readonly absoluteSafetyCeiling: number
}

export interface CharacterLimitEvaluation {
  readonly currentLinkedCharacterCount: number
  readonly configuration: CharacterLimitConfiguration
}

export type CharacterLimitDecision =
  | {
      readonly outcome: "allowed"
      readonly effectiveLimit: number
      readonly remainingCapacity: number
    }
  | {
      readonly outcome: "limit_reached"
      readonly effectiveLimit: number
    }
  | {
      readonly outcome: "invalid_configuration"
      readonly reason: string
    }
  | {
      readonly outcome: "override_required"
      readonly requestedLimit: number
      readonly absoluteSafetyCeiling: number
    }

function isNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0
}

export function evaluateCharacterLimit(
  evaluation: CharacterLimitEvaluation,
): CharacterLimitDecision {
  const { configuration } = evaluation
  const adjustments = [
    configuration.entitlementAdjustment,
    configuration.allianceRoleAdjustment,
    configuration.subscriptionAdjustment,
  ]

  if (
    !Number.isSafeInteger(configuration.baseAccountLimit) ||
    configuration.baseAccountLimit < 1 ||
    !Number.isSafeInteger(configuration.absoluteSafetyCeiling) ||
    configuration.absoluteSafetyCeiling < 1 ||
    !isNonNegativeInteger(evaluation.currentLinkedCharacterCount) ||
    adjustments.some((value) => !isNonNegativeInteger(value))
  ) {
    return {
      outcome: "invalid_configuration",
      reason: "Limits and counts must be finite, safe integers with a positive base and ceiling.",
    }
  }

  const configuredLimit =
    configuration.baseAccountLimit +
    adjustments.reduce((total, value) => total + value, 0)
  const override = configuration.administrativeOverride

  if (!Number.isSafeInteger(configuredLimit)) {
    return {
      outcome: "invalid_configuration",
      reason: "The configured character limit exceeds safe integer bounds.",
    }
  }

  if (override && (
    !Number.isSafeInteger(override.limit) ||
    override.limit < 1 ||
    override.limit > configuration.absoluteSafetyCeiling ||
    override.reason.trim().length === 0
  )) {
    return {
      outcome: "invalid_configuration",
      reason: "Administrative overrides require a reason and a finite limit within the safety ceiling.",
    }
  }

  if (
    configuredLimit > configuration.absoluteSafetyCeiling &&
    !override
  ) {
    return {
      outcome: "override_required",
      requestedLimit: configuredLimit,
      absoluteSafetyCeiling: configuration.absoluteSafetyCeiling,
    }
  }

  const effectiveLimit = override?.limit ?? configuredLimit

  if (evaluation.currentLinkedCharacterCount >= effectiveLimit) {
    return {
      outcome: "limit_reached",
      effectiveLimit,
    }
  }

  return {
    outcome: "allowed",
    effectiveLimit,
    remainingCapacity:
      effectiveLimit - evaluation.currentLinkedCharacterCount,
  }
}
