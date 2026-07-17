# ADR-0103: Distinguish primary and active character semantics

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player Domain architecture
- **Approval required from:** Clark and Aegis; Security review

## Context

Current Forge journeys load one row marked primary. In a multi-character product, a persisted default cannot safely identify the intended subject of every action, particularly across tabs, stale clients and high-risk Gift, Transfer or Alliance operations.

## Decision

Primary Character is a persisted user convenience and default navigation choice. Active Character is the explicit character context resolved for a request or workspace. Primary confers no additional ownership, verification or authority. Sensitive commands include an opaque character reference, and the server validates that exact character against the actor and current policy.

## Consequences

Client state may remember an active selection for convenience, but it is never authoritative. Switching primary and selecting active are different operations. A primary change does not rewrite already-open tabs or queued commands.

## Benefits

- Prevents wrong-character mutations.
- Makes multi-tab and integration behaviour deterministic.
- Allows a non-primary character to be used safely when explicitly selected.

## Risks

- More visible context and confirmation UX is required.
- Stale selections will produce safe failures that users need to understand.

## Alternatives considered

- Always act on primary: rejected because background changes and tabs can target the wrong character.
- Client-only active character: rejected because it can be tampered with or stale.
- Per-feature hidden defaults: rejected because semantics become inconsistent.

## Security impact

The server derives actor identity, resolves the opaque reference, checks current link/verification/authority and binds the subject into idempotency and audit. Sensitive confirmation shows a safe character snapshot.

## Privacy impact

Active selection is private user context. Logs use opaque internal references and do not record raw Player IDs.

## Operational impact

Services require stable errors for missing, stale, former, revoked, disputed and unauthorised active characters. Support must not override the selected subject silently.

## Migration impact

Existing primary-only contexts need compatibility adapters. Primary switching requires an atomic exact-one invariant; active selection may remain request-scoped until persistence is justified.

## Dependencies

[ADR-0102](./ADR-0102-configurable-multiple-character-policy.md), [ADR-0109](./ADR-0109-server-authoritative-player-operations.md), [ADR-0112](./ADR-0112-gift-centre-integration-boundary.md).

## Validation required

Cover simultaneous tabs, primary changes, stale selections, queued work, explicit non-primary actions, revocation between request and execution and idempotent replay bound to the same character.

## Revisit triggers

Revisit if Forge introduces organisation-controlled sessions, device-wide character locks or a provider session that requires a stronger active-context lifetime.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Glossary](../PLAYER_DOMAIN_GLOSSARY.md), [Player Identity Milestone 1](../PLAYER_IDENTITY_IMPLEMENTATION_MILESTONE_1.md).

## Sprint 9.3 implementation evidence

The pure Primary policy reports missing/invalid/revoked/disputed/removed states and requires an expected revision for reassignment. The server Active resolver requires an explicit requested character and never substitutes Primary. Product commands and persistence remain absent; this ADR remains **Proposed**.
