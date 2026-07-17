# ADR-0108: Resolve Alliance authority by scoped capability

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Alliance Authority boundary
- **Approval required from:** Clark and Aegis; Security and Operations review

## Context

Kingshot R1–R5 ranks express in-game hierarchy, while Forge global roles govern platform administration. Neither alone describes which Alliance resource an actor may manage or which action may be delegated.

## Decision

Alliance Authority is server-evaluated from current verified character ownership, current Alliance Membership Term, effective R1–R5 Rank Term, resource scope, requested capability and any valid delegation. Global Forge roles do not automatically map to Alliance rank or leadership. Delegations are capability-scoped, resource-scoped, time-bounded, revocable and audited.

## Consequences

UI role checks are explanatory only. Every privileged command re-evaluates authority at execution time and records the policy/rank/delegation revision used.

## Benefits

- Least privilege within each Alliance.
- Supports limited delegation without fake rank promotion.
- Prevents global admins from silently becoming Alliance leaders.

## Risks

- Capability matrices and grant ceilings require careful product policy.
- Stale caches or delayed revocation can expose operational data.

## Alternatives considered

- Numeric rank comparison only: rejected because actions and delegation differ.
- Global role mapping: rejected because platform and resource authority are unrelated.
- Free-form per-user permissions: rejected because rank/product meaning and reviewability are lost.

## Security impact

Default deny, exact resource scope, grant ceilings, short cache lifetime and immediate invalidation on membership/rank/revocation are mandatory. Client-supplied role is ignored.

## Privacy impact

Leadership and delegated scopes are visible only to audiences that need them. Authority audit avoids unnecessary personal identity in broad roster views.

## Operational impact

Requires capability registry ownership, delegation expiry, emergency suspension, succession and authority-dispute runbooks.

## Migration impact

Existing role labels require mapping evidence and cannot create authority until the capability policy is approved. Global role tables are retained and not repurposed.

## Dependencies

[ADR-0107](./ADR-0107-alliance-application-membership-rank-separation.md), [ADR-0109](./ADR-0109-server-authoritative-player-operations.md), [ADR-0118](./ADR-0118-support-intervention-model.md).

## Validation required

Exercise every capability across R1–R5, unranked, former, disputed and wrong-Alliance actors; delegation ceilings, expiry, revocation, stale tokens and concurrent rank changes.

## Revisit triggers

Revisit when Alliance product behaviour, cross-Alliance coalitions or game rank semantics materially change.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md), [Glossary](../PLAYER_DOMAIN_GLOSSARY.md).
