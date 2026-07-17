# ADR-0107: Separate Alliance application, membership and rank

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Alliance Domain
- **Approval required from:** Clark and Aegis; Security, Privacy and Operations review

## Context

Current Alliance workflows combine request, membership and role concepts behind database views and RPCs that checked-in history cannot reproduce. This risks applications appearing as membership and membership labels granting unintended authority.

## Decision

Alliance Application, Alliance Membership Term and Alliance Rank Term are separate effective records. An approved application creates a membership term in the same guarded transaction; the application itself never grants access. Membership does not automatically grant leadership. Rank terms are effective-dated, evidence-aware, revocable and scoped to one membership term.

## Consequences

Removal ends current membership and rank terms without deleting history. Delegation and capability are evaluated separately from rank labels. Disputes can freeze authority while preserving tenure evidence.

## Benefits

- Clear lifecycle and least-privilege authority.
- Auditable joins, removals and rank changes.
- Prevents stale applications or profile text from authorising operations.

## Risks

- More transitions and reconciliation rules than a single membership row.
- Existing data may not contain enough history or evidence for exact migration.

## Alternatives considered

- Single membership row with status/role: rejected because independent lifecycles become ambiguous.
- Profile Alliance text as membership: rejected as self-reported.
- Global Forge roles as Alliance ranks: rejected because scope and ownership differ.

## Security impact

Application approval re-checks verified character, Kingdom policy, current terms and approver capability atomically. Rank changes enforce grant ceilings, revision and current membership.

## Privacy impact

Application messages and decision reasons are leadership/restricted data. Historical membership visibility follows explicit policy rather than current roster visibility.

## Operational impact

Requires removal, leave, reinstatement, succession, rank correction and dispute procedures with notification and audit.

## Migration impact

Existing membership rows must be classified into application, tenure and rank evidence. Uncertain values are quarantined or migrated conservatively, never promoted silently.

## Dependencies

[ADR-0106](./ADR-0106-kingdom-membership-lifecycle.md), [ADR-0108](./ADR-0108-alliance-authority-model.md), [ADR-0119](./ADR-0119-player-audit-immutable-history.md).

## Validation required

Test submit/cancel/approve/reject, concurrent approval, one-current-tenure, leave/removal, former membership, rank changes, disputes and cross-Alliance negative access.

## Revisit triggers

Revisit if Forge supports concurrent Alliance memberships, formal coalitions or game-provided authoritative rank feeds.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Glossary](../PLAYER_DOMAIN_GLOSSARY.md), [Approval Matrix](../PLAYER_DOMAIN_APPROVAL_MATRIX.md).
