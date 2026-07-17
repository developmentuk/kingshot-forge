# ADR-0118: Constrain and audit support intervention

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player security and support governance
- **Approval required from:** Clark and Aegis; Security, Privacy and Operations review

## Context

Verification disputes, mistaken links, authority conflicts, visibility incidents and emergency suspension require support, but unrestricted admin mutation or silent impersonation would undermine ownership and audit.

## Decision

Support intervention is read-only by default and capability-, resource-, reason- and time-scoped when mutation is approved. High-risk identity, verification and leadership actions require four-eyes approval. Support may freeze risk, initiate reviewed recovery, end an invalid link through the normal lifecycle or correct visibility through an auditable command. It cannot forge verification, invent evidence, impersonate a player silently, rewrite provider results, erase history or grant unbounded Alliance authority.

## Consequences

Every grant and use is attributable, expiring and visible to audit-of-audit review. Emergency suspension may be easier to authorise than restoration or positive privilege.

## Benefits

- Enables recovery without hidden super-admin power.
- Supports least privilege and independent review.
- Preserves user and Alliance trust.

## Risks

- Four-eyes review may delay urgent recovery.
- Poorly scoped support reads can expose verification or contact data.

## Alternatives considered

- No support powers: rejected because disputes and incidents need recovery.
- Unrestricted administrator: rejected as excessive and unauditable.
- Database edits: prohibited as they bypass lifecycle and evidence.

## Security impact

Strong re-authentication, case/reason capture, action allowlist, bounded expiry, no self-approval for high risk, session controls and anomaly monitoring are required.

## Privacy impact

Support sees the minimum fields needed for the case. Sensitive reads are audited, exports are redacted and affected-user notice follows approved policy.

## Operational impact

Requires role assignment, on-call/escalation, four-eyes workflow, emergency freeze, grant expiry, periodic access review and recovery runbooks.

## Migration impact

No support grant schema is authorised until roles, scopes and retention are approved. Existing admin privileges require inventory and must not be assumed equivalent.

## Dependencies

[ADR-0104](./ADR-0104-character-verification-model.md), [ADR-0108](./ADR-0108-alliance-authority-model.md), [ADR-0119](./ADR-0119-player-audit-immutable-history.md).

## Validation required

Test no-grant, expired/revoked grant, wrong scope/resource/action, self-approval, one-versus-two approvers, emergency suspension, prohibited positive override and audit-of-audit access.

## Revisit triggers

Revisit when support staffing, incident severity model, legal duties or automated risk controls change.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Approval Matrix](../PLAYER_DOMAIN_APPROVAL_MATRIX.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md).
