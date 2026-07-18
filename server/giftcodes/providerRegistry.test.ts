import assert from 'node:assert/strict'
import test from 'node:test'
import {
  OFFICIAL_GIFT_CODE_PROVIDER_ID,
} from './officialProvider.ts'
import {
  createDefaultGiftCodeProviderRegistry,
} from './providerComposition.ts'
import type {
  GiftCodeProviderDefinition,
} from './provider.ts'
import {
  GiftCodeProviderCapabilityRegistry,
} from './providerRegistry.ts'
import {
  SIMULATION_GIFT_CODE_PROVIDER_ID,
} from './simulationProvider.ts'

const futureProvider: GiftCodeProviderDefinition = {
  id: 'future-provider',
  displayName: 'Future provider',
  capabilities: {
    executionMode: 'external',
    redemptionSupport: 'not_implemented',
    externalRequestsAllowed: false,
    requiresVerifiedCharacter: true,
    requiresConsent: true,
    supportsBatchRedemption: false,
    supportsHealthScoring: true,
  },
}

test('default capability registry exposes isolated provider definitions', () => {
  const registry =
    createDefaultGiftCodeProviderRegistry()

  assert.deepEqual(
    registry.list().map(({ id }) => id),
    [
      OFFICIAL_GIFT_CODE_PROVIDER_ID,
      SIMULATION_GIFT_CODE_PROVIDER_ID,
    ],
  )
  assert.equal(
    registry.require(
      SIMULATION_GIFT_CODE_PROVIDER_ID,
    ).capabilities.redemptionSupport,
    'simulation_only',
  )
  assert.equal(
    registry.require(OFFICIAL_GIFT_CODE_PROVIDER_ID).capabilities.externalRequestsAllowed,
    true,
  )
})

test('registry accepts a future provider without factory changes', () => {
  const registry =
    new GiftCodeProviderCapabilityRegistry([
      futureProvider,
    ])

  assert.equal(registry.has('future-provider'), true)
  assert.equal(
    registry.get('future-provider')?.displayName,
    'Future provider',
  )
  assert.equal(Object.isFrozen(registry.list()[0]), true)
})

test('registry rejects duplicate or unsafe definitions', () => {
  assert.throws(
    () =>
      new GiftCodeProviderCapabilityRegistry([
        futureProvider,
        futureProvider,
      ]),
    /registered more than once/,
  )

  assert.throws(
    () =>
      new GiftCodeProviderCapabilityRegistry([
        {
          ...futureProvider,
          id: 'unsafe-simulation',
          capabilities: {
            ...futureProvider.capabilities,
            executionMode: 'simulation',
            redemptionSupport: 'live',
            externalRequestsAllowed: true,
          },
        },
      ]),
    /simulation provider cannot allow external requests/,
  )
})
