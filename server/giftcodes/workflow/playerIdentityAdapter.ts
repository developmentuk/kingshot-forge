import type { GiftCentreIdentityResult } from '../../../shared/domains/player-identity/index.js'
import type { GiftCodeResultCode } from '../../../shared/domains/giftcodes/resultCodes.ts'
import type { GiftCodeResolvedPlayer } from './eligibilityService.ts'

const REASON_MAP: Readonly<Record<string, GiftCodeResultCode>> = Object.freeze({
  authentication_required: 'authentication_required',
  actor_not_resolved: 'authentication_required',
  character_not_found: 'character_required',
  character_required: 'character_required',
  character_not_linked: 'character_not_owned',
  active_character_required: 'character_not_active',
  active_character_not_linked: 'character_not_owned',
  active_character_not_verified: 'character_not_verified',
  active_character_verification_expired: 'character_not_verified',
  active_character_revision_conflict: 'stale_version',
  stale_revision: 'stale_version',
  character_link_verification_required: 'character_not_verified',
  character_link_revoked: 'character_revoked',
  character_link_disputed: 'character_disputed',
  character_link_removed: 'character_revoked',
  active_character_operation_not_allowed: 'character_not_active',
  gift_eligibility_unavailable: 'provider_unavailable',
  feature_disabled: 'feature_disabled',
  migration_required: 'feature_disabled',
})

function uniqueReasons(reasons: readonly GiftCodeResultCode[]) {
  return Object.freeze([...new Set(reasons)])
}

/** Maps the authoritative Player Identity projection into Gift-owned eligibility. */
export function adaptPlayerIdentityGiftEligibility(input: Readonly<{
  projection: GiftCentreIdentityResult
  characterInternalId: string
  expectedIdentityRevision: number
  now: string
}>): GiftCodeResolvedPlayer {
  const projection = input.projection
  const expired = projection.verificationState === 'expired' ||
    (projection.verificationExpiresAt !== undefined &&
      Date.parse(projection.verificationExpiresAt) <= Date.parse(input.now))
  const reasons = projection.eligibilityReasonCodes
    .map((reason) => REASON_MAP[reason])
    .filter((reason): reason is GiftCodeResultCode => reason !== undefined)

  if (!projection.actorResolved) reasons.push('authentication_required')
  if (!projection.requestedCharacterResolved) reasons.push('character_required')
  if (!projection.characterLinked) reasons.push('character_not_owned')
  if (!projection.characterActiveForRequest) reasons.push('character_not_active')
  if (projection.verificationState !== 'verified') {
    reasons.push('character_not_verified')
  }
  if (projection.disputeState === 'open') reasons.push('character_disputed')
  if (projection.revocationState !== 'current') reasons.push('character_revoked')
  if (projection.identityRevision !== input.expectedIdentityRevision) {
    reasons.push('stale_version')
  }
  if (!projection.providerPlayerIdProjectionAvailable) reasons.push('player_id_unavailable')

  return Object.freeze({
    found: projection.requestedCharacterResolved,
    actorOwnsCharacter: projection.actorResolved && projection.characterLinked && projection.revocationState === 'current',
    verified: projection.verificationState === 'verified' && !expired,
    active: projection.characterActiveForRequest,
    ownership: projection.disputeState === 'open' ? 'disputed' : projection.revocationState !== 'current' ? 'revoked' : projection.characterLinked ? 'current' : 'former',
    providerIdentityAvailable: projection.providerPlayerIdProjectionAvailable,
    characterInternalId: input.characterInternalId,
    characterRevision: projection.identityRevision,
    reasons: uniqueReasons(reasons),
  })
}

/** Transitional bridge for Gift callers that still expose only a boolean. */
export function adaptLegacyGiftEligibility(input: Readonly<{
  eligible: boolean
  characterInternalId: string
  characterRevision: number
}>): GiftCodeResolvedPlayer {
  return Object.freeze({
    found: true,
    actorOwnsCharacter: input.eligible,
    verified: input.eligible,
    active: input.eligible,
    ownership: input.eligible ? 'current' : 'former',
    providerIdentityAvailable: input.eligible,
    characterInternalId: input.characterInternalId,
    characterRevision: input.characterRevision,
    reasons: input.eligible ? Object.freeze([]) : Object.freeze(['provider_unavailable'] as const),
  })
}
