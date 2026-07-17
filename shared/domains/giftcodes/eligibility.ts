import type { GiftCodeConsentDecision } from './consent.ts'
import type { GiftCodeResultCode } from './resultCodes.ts'

export type GiftCodeCharacterOwnership =
  | 'current'
  | 'former'
  | 'disputed'
  | 'revoked'

export type GiftCodePlayerEligibilityProjection = Readonly<{
  found: boolean
  actorOwnsCharacter: boolean
  verified: boolean
  active: boolean
  ownership: GiftCodeCharacterOwnership
  providerIdentityAvailable: boolean
  reasons?: readonly GiftCodeResultCode[]
}>

export type GiftCodePublicationEligibilityProjection = Readonly<{
  found: boolean
  published: boolean
  active: boolean
  publicationVersionMatches: boolean
  expired: boolean
  withdrawn: boolean
}>

export type GiftCodeEligibilityContext = Readonly<{
  authenticated: boolean
  characterSelected: boolean
  player: GiftCodePlayerEligibilityProjection
  consent: GiftCodeConsentDecision
  publication: GiftCodePublicationEligibilityProjection
  featureEnabled: boolean
  environmentEnabled: boolean
  providerEnabled: boolean
  providerAvailable: boolean
  providerHealthy: boolean
  rateLimitAllowed: boolean
  securityHoldActive: boolean
}>

export type GiftCodeEligibilityDecision =
  | Readonly<{
      eligible: true
      code: 'eligibility_confirmed'
      reasons: readonly []
    }>
  | Readonly<{
      eligible: false
      code: 'request_conflict'
      reasons: readonly GiftCodeResultCode[]
    }>

function addReason(
  reasons: GiftCodeResultCode[],
  condition: boolean,
  reason: GiftCodeResultCode,
) {
  if (condition && !reasons.includes(reason)) {
    reasons.push(reason)
  }
}

export function evaluateGiftCodeEligibility(
  context: GiftCodeEligibilityContext,
): GiftCodeEligibilityDecision {
  const reasons: GiftCodeResultCode[] = []

  for (const reason of context.player.reasons ?? []) {
    addReason(reasons, true, reason)
  }

  addReason(
    reasons,
    !context.featureEnabled,
    'feature_disabled',
  )
  addReason(
    reasons,
    !context.environmentEnabled,
    'environment_disabled',
  )
  addReason(
    reasons,
    !context.providerEnabled,
    'provider_disabled',
  )
  addReason(
    reasons,
    !context.authenticated,
    'authentication_required',
  )
  addReason(
    reasons,
    !context.characterSelected || !context.player.found,
    'character_required',
  )

  if (context.player.found) {
    addReason(
      reasons,
      !context.player.actorOwnsCharacter ||
        context.player.ownership === 'former',
      'character_not_owned',
    )
    addReason(
      reasons,
      !context.player.verified,
      'character_not_verified',
    )
    addReason(
      reasons,
      !context.player.active,
      'character_not_active',
    )
    addReason(
      reasons,
      context.player.ownership === 'disputed',
      'character_disputed',
    )
    addReason(
      reasons,
      context.player.ownership === 'revoked',
      'character_revoked',
    )
    addReason(
      reasons,
      !context.player.providerIdentityAvailable,
      'player_id_unavailable',
    )
  }

  addReason(
    reasons,
    !context.consent.valid,
    context.consent.code,
  )
  addReason(
    reasons,
    !context.publication.found,
    'code_not_found',
  )

  if (context.publication.found) {
    addReason(
      reasons,
      !context.publication.published || !context.publication.active,
      'code_not_published',
    )
    addReason(
      reasons,
      !context.publication.publicationVersionMatches,
      'publication_version_mismatch',
    )
    addReason(
      reasons,
      context.publication.expired,
      'code_expired',
    )
    addReason(
      reasons,
      context.publication.withdrawn,
      'code_withdrawn',
    )
  }

  addReason(
    reasons,
    !context.providerAvailable,
    'provider_unavailable',
  )
  addReason(
    reasons,
    !context.providerHealthy,
    'provider_unhealthy',
  )
  addReason(
    reasons,
    !context.rateLimitAllowed,
    'rate_limited',
  )
  addReason(
    reasons,
    context.securityHoldActive,
    'security_hold',
  )

  if (reasons.length > 0) {
    return Object.freeze({
      eligible: false,
      code: 'request_conflict',
      reasons: Object.freeze(reasons),
    })
  }

  return Object.freeze({
    eligible: true,
    code: 'eligibility_confirmed',
    reasons: [] as const,
  })
}
