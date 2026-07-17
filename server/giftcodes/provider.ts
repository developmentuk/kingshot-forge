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
  requestDisposition: 'not_sent' | 'sent' | 'unknown'
  providerReference: string | null
  failureCategory: RedemptionFailureCategory | null
  retryAfterSeconds: number | null
  safeDiagnosticCode: string
  safeMessage: string
}

export const GIFT_CODE_PROVIDER_EXECUTION_MODES = [
  'simulation',
  'external',
] as const

export type GiftCodeProviderExecutionMode =
  (typeof GIFT_CODE_PROVIDER_EXECUTION_MODES)[number]

export const GIFT_CODE_PROVIDER_REDEMPTION_SUPPORT = [
  'simulation_only',
  'not_implemented',
  'live',
] as const

export type GiftCodeProviderRedemptionSupport =
  (typeof GIFT_CODE_PROVIDER_REDEMPTION_SUPPORT)[number]

export type GiftCodeProviderCapabilities = Readonly<{
  executionMode: GiftCodeProviderExecutionMode
  redemptionSupport: GiftCodeProviderRedemptionSupport
  externalRequestsAllowed: boolean
  requiresVerifiedCharacter: boolean
  requiresConsent: boolean
  supportsBatchRedemption: boolean
  supportsHealthScoring: boolean
}>

export type GiftCodeProviderDefinition = Readonly<{
  id: string
  displayName: string
  capabilities: GiftCodeProviderCapabilities
}>

export type GiftCodeRedemptionProvider = {
  id: string
  productionReady: boolean
  capabilities: GiftCodeProviderCapabilities
  redeem: (
    request: GiftCodeRedemptionRequest,
  ) => Promise<GiftCodeProviderResult>
}
