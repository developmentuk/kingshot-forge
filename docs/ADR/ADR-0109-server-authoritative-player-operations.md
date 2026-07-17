# ADR-0109: Keep sensitive Player operations server-authoritative

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player server architecture
- **Approval required from:** Aegis and Clark; Security and Database review

## Context

Many current Player mutations call Supabase directly from the browser and rely on untracked RLS, views or RPCs. The browser can provide stale or tampered identity, role, membership and revision data.

## Decision

Sensitive Player operations are resolved and authorised server-side. The server derives the actor from the validated session, resolves the exact character, checks ownership/verification, visibility, membership, authority and policy revision, validates input, applies optimistic concurrency and idempotency, performs short atomic writes and appends audit evidence. RLS and grants remain defence in depth.

## Consequences

Browsers submit intent and opaque references, not authoritative Player IDs, roles, user IDs or lifecycle states. Direct browser mutation privileges are removed only after compatible server paths are proven.

## Benefits

- One enforceable authorisation boundary.
- Stable validation, errors, audit and concurrency behaviour.
- Safer integration for Gift Centre and future Planning.

## Risks

- Additional server runtime and migration work.
- Poorly designed privileged functions or service-key use could bypass safeguards.

## Alternatives considered

- Browser plus RLS only: rejected for complex capability and cross-record invariants.
- Client role checks: rejected because they are not authority.
- Broad `SECURITY DEFINER` RPCs: rejected unless narrowly justified, secured and reviewed.

## Security impact

Bearer tokens are validated server-side; actor facts never come from user-editable JWT metadata. Privileged code uses least privilege, explicit grants, safe search paths and no client-exposed secret key.

## Privacy impact

Server projections minimise fields and redact logs/errors. Raw records, evidence and internal identifiers do not cross the browser boundary without an approved purpose.

## Operational impact

Requires correlation IDs, rate limits, idempotency receipts, observable failures, safe retry and incident kill switches for high-risk integrations.

## Migration impact

Introduce server contracts before revoking old browser writes. Rehearse policies/grants in an approved non-production target and retain rollback/compatibility paths during cutover.

## Dependencies

[ADR-0115](./ADR-0115-player-schema-recovery-strategy.md), [ADR-0117](./ADR-0117-public-player-data-api-posture.md), [ADR-0119](./ADR-0119-player-audit-immutable-history.md).

## Validation required

Contract, authentication, wrong-owner, stale-revision, idempotency, concurrency, rate-limit, RLS/grant and negative-capability tests in an approved environment.

## Revisit triggers

Revisit if Forge adopts a different trusted backend architecture or a simple low-risk operation can be proven safe through direct RLS without weakening the shared boundary.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Player Identity Milestone 1](../PLAYER_IDENTITY_IMPLEMENTATION_MILESTONE_1.md), [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Sprint 9.3 implementation evidence

Dependency-injected server actor and Active Character resolver factories revalidate the user-character link, link lifecycle, operation decision, verification requirement and optional expected revision for each request. They have no browser or persistence dependency. No executable route exists and this ADR remains **Proposed**.
