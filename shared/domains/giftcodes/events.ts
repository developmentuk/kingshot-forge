export const GIFT_CODE_DOMAIN_EVENT_TYPES = [
  'provider_registered',
  'provider_selected',
  'provider_selection_rejected',
  'provider_health_evaluated',
  'feature_gate_evaluated',
  'eligibility_evaluated',
  'consent_granted',
  'consent_revoked',
  'consent_expired',
  'request_accepted',
  'duplicate_prevented',
  'redemption_requested',
  'eligibility_failed',
  'redemption_queued',
  'request_claimed',
  'processing_started',
  'provider_call_planned',
  'provider_call_prevented',
  'simulation_executed',
  'provider_session_established',
  'provider_request_sent',
  'provider_response_received',
  'response_classified',
  'request_succeeded',
  'success_confirmed',
  'already_claimed_confirmed',
  'retry_scheduled',
  'manual_retry_requested',
  'retry_exhausted',
  'terminal_failure',
  'ambiguity_detected',
  'ambiguous_outcome',
  'redemption_cancelled',
  'redemption_expired_before_send',
  'redemption_withdrawn_before_send',
  'support_intervention',
  'security_hold_placed',
  'security_hold_released',
  'provider_disabled',
  'provider_enabled',
  'provider_circuit_opened',
  'feature_configuration_observed',
] as const

export type GiftCodeDomainEventType =
  (typeof GIFT_CODE_DOMAIN_EVENT_TYPES)[number]

export const GIFT_CODE_DOMAIN_ACTOR_TYPES = [
  'user',
  'support',
  'admin',
  'worker',
  'system',
  'deployment',
] as const

export type GiftCodeDomainActorType =
  (typeof GIFT_CODE_DOMAIN_ACTOR_TYPES)[number]

export const GIFT_CODE_EVENT_PRIVACY_CLASSIFICATIONS = [
  'operational',
  'player_sensitive',
  'consent_evidence',
  'security_audit',
] as const

export type GiftCodeEventPrivacyClassification =
  (typeof GIFT_CODE_EVENT_PRIVACY_CLASSIFICATIONS)[number]

export type GiftCodeDomainEventMetadataValue =
  | string
  | number
  | boolean
  | null

export type GiftCodeDomainEventMetadata = Readonly<
  Record<string, GiftCodeDomainEventMetadataValue>
>

export type GiftCodeDomainEvent = Readonly<{
  eventId: string
  type: GiftCodeDomainEventType
  occurredAt: string
  actorType: GiftCodeDomainActorType
  actorId: string | null
  correlationId: string
  providerId: string | null
  environment: string
  requestId: string | null
  attemptId: string | null
  consentId: string | null
  characterInternalId: string | null
  codePublicationId: string | null
  publicationVersion: string | null
  sequence: number | null
  privacyClassification: GiftCodeEventPrivacyClassification
  metadata: GiftCodeDomainEventMetadata
}>

export type CreateGiftCodeDomainEventInput = Readonly<{
  eventId: string
  type: GiftCodeDomainEventType
  occurredAt: string
  actorType: GiftCodeDomainActorType
  actorId?: string | null
  correlationId: string
  providerId?: string | null
  environment: string
  requestId?: string | null
  attemptId?: string | null
  consentId?: string | null
  characterInternalId?: string | null
  codePublicationId?: string | null
  publicationVersion?: string | null
  sequence?: number | null
  privacyClassification?: GiftCodeEventPrivacyClassification
  metadata?: Readonly<
    Record<string, GiftCodeDomainEventMetadataValue>
  >
}>

export type CreateGiftCodeAuditEventInput =
  CreateGiftCodeDomainEventInput &
    Readonly<{
      sequence: number
      privacyClassification: GiftCodeEventPrivacyClassification
    }>

export type GiftCodeAuditEvent = GiftCodeDomainEvent &
  Readonly<{
    sequence: number
  }>

const SENSITIVE_METADATA_KEY =
  /secret|signature|cookie|token|authorization|password|payload|raw|player.?id|gift.?code/i

function requireText(value: string, label: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new Error(`${label} is required.`)
  }

  return trimmed
}

function optionalText(
  value: string | null | undefined,
  label: string,
) {
  if (value === null || value === undefined) {
    return null
  }

  return requireText(value, label)
}

function requireUtcTimestamp(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(
      value,
    ) ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new Error(
      'Gift-code domain event time must be a valid UTC timestamp.',
    )
  }

  return value
}

function freezeMetadata(
  metadata: CreateGiftCodeDomainEventInput['metadata'],
) {
  const entries = Object.entries(metadata ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  )

  for (const [key, value] of entries) {
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      throw new Error(
        `Gift-code event metadata key "${key}" is invalid.`,
      )
    }

    if (SENSITIVE_METADATA_KEY.test(key)) {
      throw new Error(
        `Gift-code event metadata key "${key}" is sensitive.`,
      )
    }

    if (
      value !== null &&
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      throw new Error(
        `Gift-code event metadata value for "${key}" must be scalar.`,
      )
    }
  }

  return Object.freeze(Object.fromEntries(entries))
}

export function createGiftCodeDomainEvent(
  input: CreateGiftCodeDomainEventInput,
): GiftCodeDomainEvent {
  return Object.freeze({
    eventId: requireText(input.eventId, 'Event ID'),
    type: input.type,
    occurredAt: requireUtcTimestamp(input.occurredAt),
    actorType: input.actorType,
    actorId: optionalText(input.actorId, 'Actor ID'),
    correlationId: requireText(
      input.correlationId,
      'Correlation ID',
    ),
    providerId: optionalText(
      input.providerId,
      'Provider ID',
    ),
    environment: requireText(
      input.environment,
      'Environment',
    ),
    requestId: optionalText(
      input.requestId,
      'Request ID',
    ),
    attemptId: optionalText(
      input.attemptId,
      'Attempt ID',
    ),
    consentId: optionalText(
      input.consentId,
      'Consent ID',
    ),
    characterInternalId: optionalText(
      input.characterInternalId,
      'Character internal ID',
    ),
    codePublicationId: optionalText(
      input.codePublicationId,
      'Code publication ID',
    ),
    publicationVersion: optionalText(
      input.publicationVersion,
      'Publication version',
    ),
    sequence: input.sequence ?? null,
    privacyClassification:
      input.privacyClassification ?? 'operational',
    metadata: freezeMetadata(input.metadata),
  })
}

export function createGiftCodeAuditEvent(
  input: CreateGiftCodeAuditEventInput,
): GiftCodeAuditEvent {
  if (!Number.isInteger(input.sequence) || input.sequence < 1) {
    throw new Error(
      'Gift-code audit event sequence must be a positive integer.',
    )
  }

  return createGiftCodeDomainEvent(input) as GiftCodeAuditEvent
}
