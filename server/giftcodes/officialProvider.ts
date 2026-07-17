import type {
  GiftCodeProviderCapabilities,
  GiftCodeProviderResult,
  GiftCodeRedemptionProvider,
} from './provider.ts'

export const OFFICIAL_GIFT_CODE_PROVIDER_ID =
  'official-kingshot'

export const officialGiftCodeProviderCapabilities:
  GiftCodeProviderCapabilities = Object.freeze({
    executionMode: 'external',
    redemptionSupport: 'not_implemented',
    externalRequestsAllowed: false,
    requiresVerifiedCharacter: true,
    requiresConsent: true,
    supportsBatchRedemption: false,
    supportsHealthScoring: true,
  })

const NOT_IMPLEMENTED_RESULT: GiftCodeProviderResult =
  Object.freeze({
    status: 'not_supported',
    externalRequestSent: false,
    requestDisposition: 'not_sent',
    providerReference: null,
    failureCategory: 'permanent',
    retryAfterSeconds: null,
    safeDiagnosticCode:
      'official_provider_not_implemented',
    safeMessage:
      'Official provider redemption is not implemented or enabled.',
  })

export const officialGiftCodeProviderSkeleton:
  GiftCodeRedemptionProvider = Object.freeze({
    id: OFFICIAL_GIFT_CODE_PROVIDER_ID,
    productionReady: false,
    capabilities: officialGiftCodeProviderCapabilities,
    async redeem() {
      return NOT_IMPLEMENTED_RESULT
    },
  })
