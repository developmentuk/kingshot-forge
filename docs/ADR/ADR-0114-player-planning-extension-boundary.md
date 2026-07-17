# ADR-0114: Defer Player Planning behind identity and authority

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player Planning and Operations architecture
- **Approval required from:** Clark and Aegis; Security, Privacy and Operations review

## Context

Forge has no availability, rally, formation, assignment, requisition, attendance or War Room persistence/API. These capabilities expose sensitive operational timing and depend on trustworthy character, membership and leadership state.

## Decision

Player Planning remains a future bounded domain built only after Player Identity, current Kingdom/Alliance membership, Alliance Authority, visibility and audit foundations. Player Availability is the first extension. Later extensions may include Rally, Formation, Assignment, Requisition, Attendance and derived War Room projections. Planning consumes identity and canonical data; it does not own or weaken them.

## Consequences

No Planning product code, API, schema or migration begins in the identity milestone. Availability may be designed behind interfaces but cannot grant membership or authority.

## Benefits

- Prevents operational features from institutionalising unsafe identity assumptions.
- Gives sensitive timing and leadership data a clear owner.
- Allows incremental delivery starting with the smallest dependency-light capability.

## Risks

- Planning value is delayed while foundations are completed.
- Cross-domain event and notification contracts may require later coordination.

## Alternatives considered

- Build rally planner first: rejected because membership/authority are not safe.
- Add availability to Player Profile: rejected because operational scope/lifecycle differ.
- Copy contributed planner architecture: prohibited by the clean-room licence boundary.

## Security impact

Planning is Alliance/resource scoped, server-authorised and default private. Operational timing, formations and assignments never become public by default.

## Privacy impact

Availability and attendance can reveal real-world routines. Collection, audience, retention and deletion require explicit policy before implementation.

## Operational impact

Future Planning requires locking, concurrency, server time, audit, cancellation, notification and incident procedures.

## Migration impact

No Planning migration is authorised. Reserved logical entities remain proposals until identity and Alliance prerequisites are accepted and implemented.

## Dependencies

[ADR-0104](./ADR-0104-character-verification-model.md), [ADR-0107](./ADR-0107-alliance-application-membership-rank-separation.md), [ADR-0108](./ADR-0108-alliance-authority-model.md), [ADR-0113](./ADR-0113-notification-boundary.md).

## Validation required

Before Planning, prove verified-character resolution, current membership, capability evaluation, visibility, audit and privacy retention. Each extension requires its own threat model and test matrix.

## Revisit triggers

Revisit after Player Identity and Alliance Authority milestones are accepted or if Clark changes product sequencing through an approved decision.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Clean-room Audit](../audits/PLAYER_DOMAIN_CLEAN_ROOM_AUDIT.md), [Implementation Entry Criteria](../PLAYER_DOMAIN_IMPLEMENTATION_ENTRY_CRITERIA.md).

## Sprint 9.3 implementation evidence

The implemented paths contain identity contracts and resolvers only. No availability, rally, assignment, War Room or other Player Planning capability was added. This ADR remains **Proposed** and Planning remains blocked.
