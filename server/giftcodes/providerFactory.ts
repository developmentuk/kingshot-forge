import {
  type GiftCodeProviderGateEvaluator,
  type GiftCodeProviderGateReason,
} from './config.ts'
import type {
  GiftCodeProviderCapabilities,
  GiftCodeProviderDefinition,
  GiftCodeRedemptionProvider,
} from './provider.ts'
import {
  GiftCodeProviderCapabilityRegistry,
} from './providerRegistry.ts'

export type GiftCodeProviderBuilder =
  () => GiftCodeRedemptionProvider

export type GiftCodeProviderFactoryOptions = Readonly<{
  registry: GiftCodeProviderCapabilityRegistry
  builders: ReadonlyMap<string, GiftCodeProviderBuilder>
  evaluateGates: GiftCodeProviderGateEvaluator
}>

export type GiftCodeProviderSelectionErrorCode =
  | 'provider_not_registered'
  | 'provider_not_available'
  | 'provider_definition_mismatch'

export class GiftCodeProviderSelectionError extends Error {
  readonly code: GiftCodeProviderSelectionErrorCode
  readonly providerId: string
  readonly gateReasons: readonly GiftCodeProviderGateReason[]

  constructor(input: {
    code: GiftCodeProviderSelectionErrorCode
    providerId: string
    message: string
    gateReasons?: readonly GiftCodeProviderGateReason[]
  }) {
    super(input.message)
    this.name = 'GiftCodeProviderSelectionError'
    this.code = input.code
    this.providerId = input.providerId
    this.gateReasons = Object.freeze([
      ...(input.gateReasons ?? []),
    ])
  }
}

function capabilitiesMatch(
  actual: GiftCodeProviderCapabilities,
  expected: GiftCodeProviderCapabilities,
) {
  return (
    actual.executionMode === expected.executionMode &&
    actual.redemptionSupport ===
      expected.redemptionSupport &&
    actual.externalRequestsAllowed ===
      expected.externalRequestsAllowed &&
    actual.requiresVerifiedCharacter ===
      expected.requiresVerifiedCharacter &&
    actual.requiresConsent === expected.requiresConsent &&
    actual.supportsBatchRedemption ===
      expected.supportsBatchRedemption &&
    actual.supportsHealthScoring ===
      expected.supportsHealthScoring
  )
}

function assertProviderMatchesDefinition(
  provider: GiftCodeRedemptionProvider,
  definition: GiftCodeProviderDefinition,
) {
  if (
    provider.id !== definition.id ||
    !capabilitiesMatch(
      provider.capabilities,
      definition.capabilities,
    )
  ) {
    throw new GiftCodeProviderSelectionError({
      code: 'provider_definition_mismatch',
      providerId: definition.id,
      message:
        `Gift-code provider "${definition.id}" does not match its registered capabilities.`,
    })
  }

  if (
    provider.productionReady &&
    (
      provider.capabilities.redemptionSupport !== 'live' ||
      !provider.capabilities.externalRequestsAllowed
    )
  ) {
    throw new GiftCodeProviderSelectionError({
      code: 'provider_definition_mismatch',
      providerId: definition.id,
      message:
        `Gift-code provider "${definition.id}" cannot be production-ready without live external capability.`,
    })
  }
}

export class GiftCodeProviderFactory {
  private readonly registry:
    GiftCodeProviderCapabilityRegistry
  private readonly builders: ReadonlyMap<
    string,
    GiftCodeProviderBuilder
  >
  private readonly evaluateGates:
    GiftCodeProviderGateEvaluator

  constructor(options: GiftCodeProviderFactoryOptions) {
    this.registry = options.registry
    this.builders = new Map(options.builders)
    this.evaluateGates = options.evaluateGates
  }

  create(providerId: string) {
    const definition = this.registry.get(providerId)

    if (!definition) {
      throw new GiftCodeProviderSelectionError({
        code: 'provider_not_registered',
        providerId,
        message:
          `Gift-code provider "${providerId}" is not registered.`,
      })
    }

    const gateDecision = this.evaluateGates(definition)

    if (!gateDecision.allowed) {
      throw new GiftCodeProviderSelectionError({
        code: 'provider_not_available',
        providerId,
        message:
          `Gift-code provider "${providerId}" is disabled by feature policy.`,
        gateReasons: gateDecision.reasons,
      })
    }

    const builder = this.builders.get(providerId)

    if (!builder) {
      throw new GiftCodeProviderSelectionError({
        code: 'provider_not_available',
        providerId,
        message:
          `Gift-code provider "${providerId}" has no configured builder.`,
      })
    }

    const provider = builder()
    assertProviderMatchesDefinition(provider, definition)
    return provider
  }
}
