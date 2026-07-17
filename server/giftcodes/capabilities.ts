import type { GiftCodeResultCode } from '../../shared/domains/giftcodes/resultCodes.ts'
import type { GiftCodeRequestSnapshot } from '../../shared/domains/giftcodes/workflow.ts'

export const GIFT_CODE_SERVER_CAPABILITIES = [
  'giftcode.redemption.access',
  'giftcode.provider.operations',
  'giftcode.security_hold.manage',
  'giftcode.kill_switch.manage',
  'giftcode.audit.redacted.read',
  'giftcode.retry.bounded.approve',
] as const

export type GiftCodeServerCapability =
  (typeof GIFT_CODE_SERVER_CAPABILITIES)[number]

export const GIFT_CODE_SUPPORT_ACTIONS = [
  'view_redacted_request',
  'cancel_unsent_request',
  'approve_bounded_retry',
  'place_security_hold',
  'release_security_hold',
  'disable_provider',
  'enable_provider',
  'view_redacted_audit',
] as const

export type GiftCodeSupportAction =
  (typeof GIFT_CODE_SUPPORT_ACTIONS)[number]

export type GiftCodeCapabilityDecision = Readonly<{
  allowed: boolean
  code: GiftCodeResultCode
  requiredCapability: GiftCodeServerCapability
}>

const ACTION_CAPABILITY: Readonly<
  Record<GiftCodeSupportAction, GiftCodeServerCapability>
> = Object.freeze({
  view_redacted_request: 'giftcode.redemption.access',
  cancel_unsent_request: 'giftcode.redemption.access',
  approve_bounded_retry: 'giftcode.retry.bounded.approve',
  place_security_hold: 'giftcode.security_hold.manage',
  release_security_hold: 'giftcode.security_hold.manage',
  disable_provider: 'giftcode.kill_switch.manage',
  enable_provider: 'giftcode.kill_switch.manage',
  view_redacted_audit: 'giftcode.audit.redacted.read',
})

export function evaluateGiftCodeSupportAction(input: {
  action: GiftCodeSupportAction
  actorCapabilities: ReadonlySet<GiftCodeServerCapability>
  request?: GiftCodeRequestSnapshot
}): GiftCodeCapabilityDecision {
  const requiredCapability = ACTION_CAPABILITY[input.action]

  if (!input.actorCapabilities.has(requiredCapability)) {
    return Object.freeze({
      allowed: false,
      code: 'support_capability_required',
      requiredCapability,
    })
  }

  if (input.action === 'approve_bounded_retry') {
    const request = input.request
    const safeRetry =
      request !== undefined &&
      request.status === 'failed_retryable' &&
      request.completedAttempts < request.maximumAttempts &&
      !request.securityHoldActive

    if (!safeRetry) {
      return Object.freeze({
        allowed: false,
        code: 'support_action_forbidden',
        requiredCapability,
      })
    }
  }

  if (
    input.action === 'cancel_unsent_request' &&
    (input.request === undefined ||
      !['requested', 'queued', 'failed_retryable'].includes(
        input.request.status,
      ))
  ) {
    return Object.freeze({
      allowed: false,
      code: 'support_action_forbidden',
      requiredCapability,
    })
  }

  return Object.freeze({
    allowed: true,
    code: 'request_accepted',
    requiredCapability,
  })
}
