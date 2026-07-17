import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createGiftCodeDomainEvent,
} from './events.ts'

test('gift-code domain events are deterministic and immutable', () => {
  const input = {
    eventId: 'event-1',
    type: 'provider_selected' as const,
    occurredAt: '2026-07-17T12:00:00.000Z',
    actorType: 'system' as const,
    correlationId: 'correlation-1',
    providerId: 'simulation',
    environment: 'test',
    metadata: {
      provider_mode: 'simulation',
      external_request_sent: false,
    },
  }
  const first = createGiftCodeDomainEvent(input)
  const second = createGiftCodeDomainEvent(input)

  assert.deepEqual(first, second)
  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first.metadata), true)
  assert.deepEqual(Object.keys(first.metadata), [
    'external_request_sent',
    'provider_mode',
  ])
})

test('gift-code domain events reject sensitive metadata keys', () => {
  assert.throws(
    () =>
      createGiftCodeDomainEvent({
        eventId: 'event-2',
        type: 'provider_response_received',
        occurredAt: '2026-07-17T12:00:00Z',
        actorType: 'worker',
        correlationId: 'correlation-2',
        providerId: 'official-kingshot',
        environment: 'test',
        metadata: {
          provider_signature: 'not-a-real-value',
        },
      }),
    /metadata key.*sensitive/,
  )
})

test('gift-code domain events require explicit UTC evidence', () => {
  assert.throws(
    () =>
      createGiftCodeDomainEvent({
        eventId: 'event-3',
        type: 'feature_gate_evaluated',
        occurredAt: '17 July 2026',
        actorType: 'system',
        correlationId: 'correlation-3',
        environment: 'test',
      }),
    /valid UTC timestamp/,
  )
})
