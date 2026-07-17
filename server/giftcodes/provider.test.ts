import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GIFT_CODE_REDEMPTION_FLAG,
  assertProviderCanRun,
  readGiftCodeRedemptionConfig,
} from './config.ts'
import { mockGiftCodeRedemptionProvider } from './mockProvider.ts'

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

test('mock provider never reports a real redemption', async () => {
  const result =
    await mockGiftCodeRedemptionProvider.redeem({
      attemptId: 'attempt-1',
      playerAccountId: 'account-1',
      playerId: 'player-1',
      giftCodeId: 'code-1',
      giftCodeVersion: 'published-1',
      code: 'TESTCODE',
      idempotencyKey: 'idempotency-1',
      consentVersion: 'consent-1',
    })

  assert.equal(result.status, 'simulation_only')
  assert.equal(result.externalRequestSent, false)
  assert.equal(result.providerReference, null)
  assert.match(result.safeMessage, /No external request/)
})

test('mock provider is rejected when the flag is enabled', () => {
  assert.throws(
    () =>
      assertProviderCanRun(
        { enabled: true },
        mockGiftCodeRedemptionProvider,
      ),
    /simulation-only provider/,
  )
})
