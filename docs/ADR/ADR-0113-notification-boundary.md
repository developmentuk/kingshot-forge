# ADR-0113: Keep notification delivery in the notification platform

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Notification platform boundary
- **Approval required from:** Clark and Aegis; Security, Privacy and Operations review

## Context

Player, Verification, Alliance, Transfer, Gift Centre and future Planning need reminders and security notices, but Forge has no shared notification platform. Feature-owned delivery would duplicate preferences, retries and consent handling.

## Decision

Player domains emit versioned notification intents and security/revocation events. A future Notification platform owns preferences, subscriptions, channel providers, quiet hours, retries, delivery records, opt-out and provider operations. Feature domains retain their business state and never infer success from delivery.

## Consequences

No Player feature sends email, Discord or push directly. Security-critical events may follow separately approved mandatory-notice rules but still use the shared delivery boundary.

## Benefits

- Consistent preferences, consent and retry behaviour.
- Prevents revoked members from retaining subscriptions.
- Separates business transactions from unreliable providers.

## Risks

- Notification infrastructure can become a shared bottleneck.
- Delayed revocation or stale subscriptions can disclose sensitive events.

## Alternatives considered

- Feature-specific delivery: rejected as duplicated and inconsistent.
- Database triggers calling providers: rejected due hidden side effects and recovery difficulty.
- No notifications: retained only until a safe platform exists, but insufficient for mature verification/operations.

## Security impact

Recipients and scope are re-authorised before sensitive delivery. Provider credentials are server-only; content is minimised and redacted.

## Privacy impact

Channel, quiet-hour and opt-out preferences are private. Membership, timing and dispute content must not leak through subject lines, previews or wrong-channel delivery.

## Operational impact

Requires idempotent intents, bounded retries, dead-letter handling, provider health, cancellation on revocation and delivery observability.

## Migration impact

No notification schema is authorised now. Feature milestones may define intent contracts behind an interface until the shared platform is approved.

## Dependencies

[ADR-0116](./ADR-0116-player-data-classification-retention.md), [ADR-0119](./ADR-0119-player-audit-immutable-history.md), approved channel and consent policy.

## Validation required

Test opt-out, quiet hours, wrong recipient, former membership, revocation during retry, duplicate intent, provider outage, sensitive-content redaction and cancellation.

## Revisit triggers

Revisit when Forge selects initial channels, adopts a durable workflow provider or defines mandatory security notice policy.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md), [Approval Matrix](../PLAYER_DOMAIN_APPROVAL_MATRIX.md).
