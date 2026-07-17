import type {
  GiftCodeRedemptionProvider,
} from './provider.ts'

export const mockGiftCodeRedemptionProvider:
  GiftCodeRedemptionProvider = {
    id: 'mock-simulation-only',
    productionReady: false,
    async redeem() {
      return {
        status: 'simulation_only',
        externalRequestSent: false,
        providerReference: null,
        failureCategory: null,
        safeMessage:
          'Simulation only. No external request was sent and no gift code was redeemed.',
      }
    },
  }
