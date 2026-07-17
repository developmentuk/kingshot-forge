import {
  createGiftCodeProviderGateEvaluator,
  readGiftCodeFeatureGates,
} from './config.ts'
import {
  OFFICIAL_GIFT_CODE_PROVIDER_ID,
  officialGiftCodeProviderCapabilities,
  officialGiftCodeProviderSkeleton,
} from './officialProvider.ts'
import type {
  GiftCodeProviderDefinition,
} from './provider.ts'
import {
  GiftCodeProviderFactory,
  type GiftCodeProviderBuilder,
} from './providerFactory.ts'
import {
  GiftCodeProviderCapabilityRegistry,
} from './providerRegistry.ts'
import {
  SIMULATION_GIFT_CODE_PROVIDER_ID,
  simulationGiftCodeProviderCapabilities,
  simulationGiftCodeRedemptionProvider,
} from './simulationProvider.ts'

export const DEFAULT_GIFT_CODE_PROVIDER_DEFINITIONS:
  readonly GiftCodeProviderDefinition[] = Object.freeze([
    Object.freeze({
      id: SIMULATION_GIFT_CODE_PROVIDER_ID,
      displayName: 'Deterministic simulation',
      capabilities:
        simulationGiftCodeProviderCapabilities,
    }),
    Object.freeze({
      id: OFFICIAL_GIFT_CODE_PROVIDER_ID,
      displayName: 'Official Kingshot provider',
      capabilities: officialGiftCodeProviderCapabilities,
    }),
  ])

export function createDefaultGiftCodeProviderRegistry() {
  return new GiftCodeProviderCapabilityRegistry(
    DEFAULT_GIFT_CODE_PROVIDER_DEFINITIONS,
  )
}

export function createDefaultGiftCodeProviderFactory(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const registry =
    createDefaultGiftCodeProviderRegistry()
  const builders = new Map<
    string,
    GiftCodeProviderBuilder
  >([
    [
      SIMULATION_GIFT_CODE_PROVIDER_ID,
      () => simulationGiftCodeRedemptionProvider,
    ],
    [
      OFFICIAL_GIFT_CODE_PROVIDER_ID,
      () => officialGiftCodeProviderSkeleton,
    ],
  ])

  return new GiftCodeProviderFactory({
    registry,
    builders,
    evaluateGates: createGiftCodeProviderGateEvaluator(
      readGiftCodeFeatureGates(environment),
    ),
  })
}
