import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createGiftCodeIdempotencyIdentity,
  resolveGiftCodeDuplicate,
} from './idempotency.ts'

const identity = {
  environment: 'test',
  providerId: 'official-kingshot',
  operation: 'redeem' as const,
  verifiedCharacterInternalId: 'character-1',
  giftCodePublicationId: 'publication-1',
  publicationVersion: '4',
}

test('idempotency identity is canonical and SHA-256 deterministic', () => {
  const first = createGiftCodeIdempotencyIdentity(identity)
  const reordered = createGiftCodeIdempotencyIdentity({
    publicationVersion: '4',
    giftCodePublicationId: 'publication-1',
    verifiedCharacterInternalId: 'character-1',
    operation: 'redeem',
    providerId: 'official-kingshot',
    environment: 'test',
  })

  assert.deepEqual(first, reordered)
  assert.equal(first.ok, true)
  if (!first.ok) return
  assert.match(first.hash, /^[a-f0-9]{64}$/)
  assert.match(first.canonicalMaterial, /^giftcode-redemption:v2\|/)
})
test('every durable identity component changes the hash', () => {
  const original = createGiftCodeIdempotencyIdentity(identity)
  assert.equal(original.ok, true)
  if (!original.ok) return

  const variants = [
    { ...identity, environment: 'staging' },
    { ...identity, providerId: 'future-provider' },
    {
      ...identity,
      verifiedCharacterInternalId: 'character-2',
    },
    { ...identity, giftCodePublicationId: 'publication-2' },
    { ...identity, publicationVersion: '5' },
  ]

  for (const variant of variants) {
    const result = createGiftCodeIdempotencyIdentity(variant)
    assert.equal(result.ok, true)
    if (result.ok) assert.notEqual(result.hash, original.hash)
  }
})

test('missing identity fields fail without hashing partial material', () => {
  assert.deepEqual(
    createGiftCodeIdempotencyIdentity({
      ...identity,
      verifiedCharacterInternalId: ' ',
    }),
    {
      ok: false,
      code: 'request_conflict',
      field: 'verifiedCharacterInternalId',
    },
  )
})

test('concurrent duplicate contract returns the winning request', () => {
  assert.deepEqual(resolveGiftCodeDuplicate(null), {
    createNew: true,
    code: 'request_accepted',
  })
  assert.deepEqual(resolveGiftCodeDuplicate('queued'), {
    createNew: false,
    code: 'duplicate_existing_request',
  })
  assert.deepEqual(resolveGiftCodeDuplicate('ambiguous'), {
    createNew: false,
    code: 'ambiguous_existing_request',
  })
  assert.deepEqual(resolveGiftCodeDuplicate('already_claimed'), {
    createNew: false,
    code: 'already_claimed',
  })
})
