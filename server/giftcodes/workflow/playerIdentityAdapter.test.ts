import assert from 'node:assert/strict'
import test from 'node:test'
import { adaptPlayerIdentityGiftEligibility } from './playerIdentityAdapter.ts'
import type { GiftCentreIdentityResult } from '../../../shared/domains/player-identity/index.js'
import type { PlayerIdentityRevision } from '../../../shared/domains/player-identity/identifiers.js'

test('Gift adapter consumes Player Identity projection and preserves blocking reasons', () => {
  const result = adaptPlayerIdentityGiftEligibility({
    expectedIdentityRevision: 4 as PlayerIdentityRevision,
    characterInternalId: 'opaque-character',
    now: '2026-07-17T12:00:00.000Z',
    projection: {
      actorResolved: true,
      requestedCharacterResolved: true,
      characterLinked: true,
      characterActiveForRequest: false,
      verificationState: 'expired',
      verificationExpiresAt: '2026-07-16T12:00:00.000Z',
      disputeState: 'open',
      revocationState: 'current',
      identityRevision: 3 as PlayerIdentityRevision,
      providerPlayerIdProjectionAvailable: false,
      eligibilityReasonCodes: ['active_character_required', 'stale_revision'],
      display: { displayName: 'Linked character' },
    } satisfies GiftCentreIdentityResult,
  })

  assert.equal(result.active, false)
  assert.equal(result.verified, false)
  assert.deepEqual(new Set(result.reasons ?? []), new Set([
    'character_not_active',
    'character_not_verified',
    'character_disputed',
    'stale_version',
    'player_id_unavailable',
  ]))
})
