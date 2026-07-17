import type {
  GiftCodeRedemptionAttempt,
  GiftCodeRequestSnapshot,
} from './workflow.ts'

export type GiftCodeAmbiguityPolicy = Readonly<{
  automaticRetryAllowed: false
  userRetryAllowed: false
  replacementRequestAllowed: false
  reconciliationRequired: true
  supportReviewAllowed: true
  safeResultCode: 'provider_ambiguous'
}>

export function evaluateGiftCodeAmbiguity(input: {
  request: GiftCodeRequestSnapshot
  attempt: GiftCodeRedemptionAttempt
}): GiftCodeAmbiguityPolicy | null {
  if (
    input.request.status !== 'ambiguous' ||
    input.attempt.outcome !== 'provider_ambiguous' ||
    input.attempt.requestDisposition === 'not_sent'
  ) {
    return null
  }

  return Object.freeze({
    automaticRetryAllowed: false,
    userRetryAllowed: false,
    replacementRequestAllowed: false,
    reconciliationRequired: true,
    supportReviewAllowed: true,
    safeResultCode: 'provider_ambiguous',
  })
}
