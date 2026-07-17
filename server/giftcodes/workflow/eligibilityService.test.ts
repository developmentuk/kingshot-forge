import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GIFT_CODE_CONSENT_PURPOSE,
  type GiftCodeRedemptionConsent,
} from '../../../shared/domains/giftcodes/consent.ts'
import { GiftCodeEligibilityService } from './eligibilityService.ts'

const digest = 'b'.repeat(64)
const now = '2026-07-17T12:00:00.000Z'

const consent: GiftCodeRedemptionConsent = {
  consentId: 'consent-1',
  policyVersion: 'policy-v1',
  policyDigest: digest,
  purpose: GIFT_CODE_CONSENT_PURPOSE,
  userId: 'user-1',
  characterInternalId: 'character-1',
  characterRevision: 7,
  providerId: 'official-kingshot',
  providerMode: 'single_code',
  environment: 'test',
  grantedAt: '2026-07-16T12:00:00.000Z',
  revokedAt: null,
  expiresAt: '2026-07-18T12:00:00.000Z',
  evidenceVersion: 'surface-v1',
  evidenceMetadata: {},
}

function ports(overrides: {
  playerOwned?: boolean
  published?: boolean
} = {}) {
  let playerResolutionInput: unknown = null
  return {
    getPlayerResolutionInput: () => playerResolutionInput,
    ports: {
      async resolveActor() {
        return { authenticated: true, userId: 'user-1' }
      },
      async resolvePlayer(input: unknown) {
        playerResolutionInput = input
        return {
          found: true,
          actorOwnsCharacter: overrides.playerOwned ?? true,
          verified: true,
          active: true,
          ownership: 'current' as const,
          providerIdentityAvailable: true,
          characterInternalId: 'character-1',
          characterRevision: 7,
        }
      },
      async resolvePublication() {
        return {
          found: true,
          published: overrides.published ?? true,
          active: overrides.published ?? true,
          publicationVersionMatches: true,
          expired: false,
          withdrawn: false,
        }
      },
      async resolveConsent() {
        return consent
      },
      async resolveFeaturePolicy() {
        return {
          featureEnabled: true,
          environmentEnabled: true,
          providerEnabled: true,
        }
      },
      async resolveProviderAvailability() {
        return { available: true, healthy: true }
      },
      async resolveRateLimit() {
        return { allowed: true }
      },
      async resolveSecurityHold() {
        return { active: false }
      },
    },
  }
}

const command = {
  characterRef: 'character-ref-1',
  codePublicationRef: 'publication-ref-1',
  expectedPublicationVersion: '4',
  providerId: 'official-kingshot',
  providerMode: 'single_code' as const,
  environment: 'test',
  consentPolicyVersion: 'policy-v1',
  consentPolicyDigest: digest,
  now,
}

test('injected eligibility composes authoritative domain projections', async () => {
  const fixture = ports()
  const service = new GiftCodeEligibilityService(fixture.ports)

  assert.deepEqual(await service.evaluate(command), {
    eligible: true,
    code: 'eligibility_confirmed',
    reasons: [],
  })
  assert.deepEqual(fixture.getPlayerResolutionInput(), {
    userId: 'user-1',
    characterRef: 'character-ref-1',
    purpose: 'official_gift_code_redemption',
  })
})
test('client commands cannot supply a Player ID or bypass ownership', async () => {
  assert.equal('playerId' in command, false)
  const fixture = ports({ playerOwned: false })
  const result = await new GiftCodeEligibilityService(
    fixture.ports,
  ).evaluate(command)

  assert.equal(result.eligible, false)
  assert.ok(result.reasons.includes('character_not_owned'))
})

test('publication state is owned by the injected publication port', async () => {
  const fixture = ports({ published: false })
  const result = await new GiftCodeEligibilityService(
    fixture.ports,
  ).evaluate(command)

  assert.equal(result.eligible, false)
  assert.ok(result.reasons.includes('code_not_published'))
})
