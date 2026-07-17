# ADR-0102: Keep linked-character limits in configurable policy

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player Domain architecture and product policy
- **Approval required from:** Clark and Aegis; Security and Operations review

## Context

Players may operate several Kingshot characters. A fixed schema or architectural maximum would couple identity design to a temporary product entitlement and make supporter, Alliance-role, administrative or future subscription policies require structural changes.

## Decision

The architecture supports an unbounded cardinality of Character Links. The server enforces an effective configurable policy limit at command time. Policy may consider a default account allowance, supporter tier, Alliance-role entitlement, administrative exception or future subscription entitlement. This ADR does not approve, price or implement any entitlement.

Exactly one Primary Character is the recommended convenience rule when current links exist. Sensitive requests still require an explicit Active Character.

## Consequences

No database constraint, type or API contract encodes three as the maximum. Product policy must define a finite default before general use, and exceeding a reduced limit must not silently delete links.

## Benefits

- Changes account policy without schema redesign.
- Supports legitimate multi-character play and future commercial policy.
- Keeps limits server-authoritative and auditable.

## Risks

- Weak or missing policy could allow resource abuse, enumeration or verification cost amplification.
- Entitlement changes can create fairness, support and stale-cache issues.

## Alternatives considered

- Architectural maximum of three: rejected because it hard-codes a launch policy.
- Unlimited default entitlement: rejected because abuse and operating cost are unresolved.
- Separate schemas per account tier: rejected as unnecessary structural coupling.

## Security impact

Link creation is rate-limited and checks the effective policy, actor, duplicate association and verification conflict. Administrative exceptions are scoped, expiring and audited.

## Privacy impact

Additional characters increase linked identity exposure. Public projections remain per-character and never reveal a user's complete link set.

## Operational impact

Policy changes require observability, support messaging and deterministic handling for accounts already above a new limit. Existing links become read-only/reconciliation candidates rather than being deleted automatically.

## Migration impact

Future schema must support many links and an exact-primary invariant without a numeric hard limit. Entitlement storage is out of scope until separately approved.

## Dependencies

[ADR-0100](./ADR-0100-separate-user-and-character-identity.md), [ADR-0103](./ADR-0103-primary-and-active-character-semantics.md), and the [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md).

## Validation required

Test limit calculation, concurrent link requests, changed entitlement, administrative exception expiry, over-limit accounts, zero/one/many-character UI and cross-character isolation.

## Revisit triggers

Revisit when Forge defines supporter or subscription entitlements, introduces organisation-managed characters, or observes material abuse/cost evidence.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Glossary](../PLAYER_DOMAIN_GLOSSARY.md), [Approval Matrix](../PLAYER_DOMAIN_APPROVAL_MATRIX.md).

## Sprint 9.3 implementation evidence

A pure finite policy accepts base, entitlement, Alliance-role, subscription, administrative override and safety-ceiling inputs. No architectural maximum or commercial implementation was introduced; the only numeric default is explicitly non-production test data. This ADR remains **Proposed**.
