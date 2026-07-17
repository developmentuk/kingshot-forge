import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assessGiftCodeProviderHealth,
  type GiftCodeProviderHealthWindow,
} from './providerHealth.ts'

const healthyWindow: GiftCodeProviderHealthWindow = {
  providerEnabled: true,
  circuitState: 'closed',
  successful: 98,
  terminalFailures: 1,
  transientFailures: 0,
  ambiguous: 0,
  rateLimited: 1,
  p95LatencyMs: 900,
  oldestQueueAgeSeconds: 30,
}

test('disabled and unobserved providers are distinguished', () => {
  assert.deepEqual(
    assessGiftCodeProviderHealth({
      ...healthyWindow,
      providerEnabled: false,
    }),
    {
      status: 'disabled',
      score: null,
      sampleSize: 100,
      reasons: ['provider_disabled'],
    },
  )

  assert.deepEqual(
    assessGiftCodeProviderHealth({
      ...healthyWindow,
      successful: 0,
      terminalFailures: 0,
      rateLimited: 0,
    }),
    {
      status: 'unknown',
      score: null,
      sampleSize: 0,
      reasons: ['insufficient_data'],
    },
  )
})

test('health score is deterministic and reports contributing reasons', () => {
  assert.deepEqual(
    assessGiftCodeProviderHealth(healthyWindow),
    {
      status: 'healthy',
      score: 99,
      sampleSize: 100,
      reasons: ['provider_rate_limited'],
    },
  )

  assert.deepEqual(
    assessGiftCodeProviderHealth({
      providerEnabled: true,
      circuitState: 'closed',
      successful: 70,
      terminalFailures: 10,
      transientFailures: 10,
      ambiguous: 5,
      rateLimited: 5,
      p95LatencyMs: 3000,
      oldestQueueAgeSeconds: 330,
    }),
    {
      status: 'degraded',
      score: 76,
      sampleSize: 100,
      reasons: [
        'elevated_failure_rate',
        'ambiguous_outcomes_present',
        'provider_rate_limited',
        'high_latency',
        'queue_backlog',
      ],
    },
  )
})

test('an open circuit is always critical', () => {
  assert.deepEqual(
    assessGiftCodeProviderHealth({
      ...healthyWindow,
      circuitState: 'open',
    }),
    {
      status: 'critical',
      score: 0,
      sampleSize: 100,
      reasons: ['circuit_open'],
    },
  )
})

test('invalid health counters fail closed', () => {
  assert.throws(
    () =>
      assessGiftCodeProviderHealth({
        ...healthyWindow,
        ambiguous: -1,
      }),
    /non-negative integer/,
  )
})
