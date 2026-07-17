import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GIFT_CODE_APPROVED_ENVIRONMENT_FLAG,
  GIFT_CODE_OFFICIAL_PROVIDER_FLAG,
  GIFT_CODE_REDEMPTION_FLAG,
  assertProviderCanRun,
  readGiftCodeFeatureGates,
  readGiftCodeRedemptionConfig,
} from './config.ts'
import { mockGiftCodeRedemptionProvider } from './mockProvider.ts'
import { officialGiftCodeProviderSkeleton } from './officialProvider.ts'

const request = {
  attemptId: 'attempt-1',
  playerAccountId: 'account-1',
  playerId: 'player-1',
  giftCodeId: 'code-1',
  giftCodeVersion: 'published-1',
  code: 'TESTCODE',
  idempotencyKey: 'idempotency-1',
  consentVersion: 'consent-1',
}

test('redemption is disabled by default', () => {
  assert.deepEqual(readGiftCodeRedemptionConfig({}), {
    enabled: false,
  })
})

test('only the exact true value enables the flag', () => {
  assert.deepEqual(
    readGiftCodeRedemptionConfig({
      [GIFT_CODE_REDEMPTION_FLAG]: 'true',
    }),
    { enabled: true },
  )
  assert.deepEqual(
    readGiftCodeRedemptionConfig({
      [GIFT_CODE_REDEMPTION_FLAG]: 'TRUE',
    }),
    { enabled: false },
  )
})

test('all live feature gates default to off', () => {
  assert.deepEqual(readGiftCodeFeatureGates({}), {
    redemptionEnabled: false,
    officialProviderEnabled: false,
    approvedEnvironment: false,
  })

  assert.deepEqual(
    readGiftCodeFeatureGates({
      [GIFT_CODE_REDEMPTION_FLAG]: 'true',
      [GIFT_CODE_OFFICIAL_PROVIDER_FLAG]: 'TRUE',
      [GIFT_CODE_APPROVED_ENVIRONMENT_FLAG]: '1',
    }),
    {
      redemptionEnabled: true,
      officialProviderEnabled: false,
      approvedEnvironment: false,
    },
  )
})

test('simulation provider is deterministic and never reports success', async () => {
  const firstResult =
    await mockGiftCodeRedemptionProvider.redeem(request)
  const secondResult =
    await mockGiftCodeRedemptionProvider.redeem(request)

  assert.deepEqual(firstResult, secondResult)
  assert.equal(firstResult.status, 'simulation_only')
  assert.notEqual(firstResult.status, 'succeeded')
  assert.equal(firstResult.externalRequestSent, false)
  assert.equal(firstResult.requestDisposition, 'not_sent')
  assert.equal(firstResult.providerReference, null)
  assert.match(firstResult.safeMessage, /No external request/)
})

test('simulation provider is rejected even when every live gate is enabled', () => {
  assert.throws(
    () =>
      assertProviderCanRun(
        {
          redemptionEnabled: true,
          officialProviderEnabled: true,
          approvedEnvironment: true,
        },
        mockGiftCodeRedemptionProvider,
      ),
    /non-production provider/,
  )
})

test('production execution guard requires every live gate', () => {
  assert.throws(
    () =>
      assertProviderCanRun(
        {
          redemptionEnabled: true,
          officialProviderEnabled: true,
          approvedEnvironment: false,
        },
        {
          id: 'future-live-provider',
          productionReady: true,
          capabilities: {
            executionMode: 'external',
            redemptionSupport: 'live',
            externalRequestsAllowed: true,
            requiresVerifiedCharacter: true,
            requiresConsent: true,
            supportsBatchRedemption: false,
            supportsHealthScoring: true,
          },
          async redeem() {
            throw new Error(
              'The gate test must never execute the provider.',
            )
          },
        },
      ),
    /environment is not approved/,
  )
})

test('official provider skeleton cannot contact external systems', async () => {
  const originalFetch = globalThis.fetch
  let fetchCalls = 0

  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('Unexpected external request.')
  }

  try {
    const result =
      await officialGiftCodeProviderSkeleton.redeem(
        request,
      )

    assert.equal(fetchCalls, 0)
    assert.equal(result.status, 'not_supported')
    assert.equal(result.externalRequestSent, false)
    assert.equal(result.requestDisposition, 'not_sent')
    assert.equal(
      result.safeDiagnosticCode,
      'official_provider_not_implemented',
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
