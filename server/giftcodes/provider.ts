import type {
  RedemptionFailureCategory,
  RedemptionOutcomeStatus,
} from '../../shared/domains/giftcodes/redemption.ts'

export type GiftCodeRedemptionRequest = {
  attemptId: string
  playerAccountId: string
  playerId: string
  giftCodeId: string
  giftCodeVersion: string
  code: string
  idempotencyKey: string
  consentVersion: string
}

export type GiftCodeProviderResult = {
  status: RedemptionOutcomeStatus
  externalRequestSent: boolean
  providerReference: string | null
  failureCategory: RedemptionFailureCategory | null
  safeMessage: string
}

export type GiftCodeRedemptionProvider = {
  id: string
  productionReady: boolean
  redeem: (
    request: GiftCodeRedemptionRequest,
  ) => Promise<GiftCodeProviderResult>
}
