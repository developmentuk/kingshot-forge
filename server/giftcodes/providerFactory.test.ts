import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GIFT_CODE_APPROVED_ENVIRONMENT_FLAG,
  GIFT_CODE_OFFICIAL_PROVIDER_FLAG,
  GIFT_CODE_REDEMPTION_FLAG,
} from './config.ts'
import {
  OFFICIAL_GIFT_CODE_PROVIDER_ID,
} from './officialProvider.ts'
import type {
  GiftCodeProviderDefinition,
  GiftCodeRedemptionProvider,
} from './provider.ts'
import {
  GiftCodeProviderFactory,
  GiftCodeProviderSelectionError,
} from './providerFactory.ts'
import {
  createDefaultGiftCodeProviderFactory,
} from './providerComposition.ts'
import {
  GiftCodeProviderCapabilityRegistry,
} from './providerRegistry.ts'
import {
  SIMULATION_GIFT_CODE_PROVIDER_ID,
  simulationGiftCodeProviderCapabilities,
} from './simulationProvider.ts'

test('default factory selects simulation while official remains gated off', () => {
  const factory =
    createDefaultGiftCodeProviderFactory({})

  assert.equal(
    factory.create(SIMULATION_GIFT_CODE_PROVIDER_ID).id,
    SIMULATION_GIFT_CODE_PROVIDER_ID,
  )

  assert.throws(
    () => factory.create(OFFICIAL_GIFT_CODE_PROVIDER_ID),
    (error) => {
      assert.ok(error instanceof GiftCodeProviderSelectionError)
      assert.equal(error.code, 'provider_not_available')
      assert.deepEqual(error.gateReasons, [
        'redemption_disabled',
        'official_provider_disabled',
        'environment_not_approved',
      ])
      return true
    },
  )
})

test('explicit gates select the server-configured official provider boundary', () => {
  const factory = createDefaultGiftCodeProviderFactory({
    [GIFT_CODE_REDEMPTION_FLAG]: 'true',
    [GIFT_CODE_OFFICIAL_PROVIDER_FLAG]: 'true',
    [GIFT_CODE_APPROVED_ENVIRONMENT_FLAG]: 'true',
  })
  const provider = factory.create(
    OFFICIAL_GIFT_CODE_PROVIDER_ID,
  )

  assert.equal(provider.id, OFFICIAL_GIFT_CODE_PROVIDER_ID)
  assert.equal(provider.productionReady, false)
  assert.equal(provider.capabilities.externalRequestsAllowed, true)
  assert.equal(
    provider.capabilities.redemptionSupport,
    'live',
  )
})

test('factory dependencies accept a future provider builder', () => {
  const definition: GiftCodeProviderDefinition = {
    id: 'injected-provider',
    displayName: 'Injected provider',
    capabilities: simulationGiftCodeProviderCapabilities,
  }
  const provider: GiftCodeRedemptionProvider = {
    id: definition.id,
    productionReady: false,
    capabilities: definition.capabilities,
    async redeem() {
      return {
        status: 'simulation_only',
        externalRequestSent: false,
        requestDisposition: 'not_sent',
        providerReference: null,
        failureCategory: null,
        retryAfterSeconds: null,
        safeDiagnosticCode: 'injected_simulation',
        safeMessage: 'Injected simulation.',
      }
    },
  }
  let buildCount = 0
  const factory = new GiftCodeProviderFactory({
    registry: new GiftCodeProviderCapabilityRegistry([
      definition,
    ]),
    builders: new Map([
      [
        definition.id,
        () => {
          buildCount += 1
          return provider
        },
      ],
    ]),
    evaluateGates: () => ({
      allowed: true,
      reasons: [],
    }),
  })

  assert.equal(factory.create(definition.id), provider)
  assert.equal(buildCount, 1)
})

test('factory rejects unknown and mismatched providers', () => {
  const factory =
    createDefaultGiftCodeProviderFactory({})

  assert.throws(
    () => factory.create('missing-provider'),
    (error) =>
      error instanceof GiftCodeProviderSelectionError &&
      error.code === 'provider_not_registered',
  )

  const definition: GiftCodeProviderDefinition = {
    id: 'expected-provider',
    displayName: 'Expected provider',
    capabilities: simulationGiftCodeProviderCapabilities,
  }
  const mismatchedFactory = new GiftCodeProviderFactory({
    registry: new GiftCodeProviderCapabilityRegistry([
      definition,
    ]),
    builders: new Map([
      [
        definition.id,
        () => ({
          ...factory.create(
            SIMULATION_GIFT_CODE_PROVIDER_ID,
          ),
          id: 'different-provider',
        }),
      ],
    ]),
    evaluateGates: () => ({
      allowed: true,
      reasons: [],
    }),
  })

  assert.throws(
    () => mismatchedFactory.create(definition.id),
    (error) =>
      error instanceof GiftCodeProviderSelectionError &&
      error.code === 'provider_definition_mismatch',
  )
})
