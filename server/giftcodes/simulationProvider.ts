import type {
  GiftCodeProviderCapabilities,
  GiftCodeProviderResult,
  GiftCodeRedemptionProvider,
} from './provider.ts'

export const SIMULATION_GIFT_CODE_PROVIDER_ID =
  'simulation'

export const simulationGiftCodeProviderCapabilities:
  GiftCodeProviderCapabilities = Object.freeze({
    executionMode: 'simulation',
    redemptionSupport: 'simulation_only',
    externalRequestsAllowed: false,
    requiresVerifiedCharacter: true,
    requiresConsent: true,
    supportsBatchRedemption: false,
    supportsHealthScoring: true,
  })

const SIMULATION_RESULT: GiftCodeProviderResult =
  Object.freeze({
    status: 'simulation_only',
    externalRequestSent: false,
    requestDisposition: 'not_sent',
    providerReference: null,
    failureCategory: null,
    retryAfterSeconds: null,
    safeDiagnosticCode: 'simulation_only',
    safeMessage:
      'Simulation only. No external request was sent and no gift code was redeemed.',
  })

export const simulationGiftCodeRedemptionProvider:
  GiftCodeRedemptionProvider = Object.freeze({
    id: SIMULATION_GIFT_CODE_PROVIDER_ID,
    productionReady: false,
    capabilities: simulationGiftCodeProviderCapabilities,
    async redeem() {
      return SIMULATION_RESULT
    },
  })
