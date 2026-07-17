# ADR-0104: Use provider-neutral evidence-backed character verification

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Character Verification boundary
- **Approval required from:** Clark and Aegis; Security, Privacy and Operations review

## Context

Forge has verification-like labels but no reproducible case, evidence, decision, expiry, revocation, dispute or recovery model. No ownership-proof provider or method is approved.

## Decision

Character Ownership Verification will use provider-neutral cases, time-bounded challenges where applicable, protected evidence, immutable decisions and an effective state derived from decision, expiry, revocation and dispute. Verification is expiring, revocable, disputable and recoverable. Re-verification creates a new case and decision; it does not rewrite history.

No verification provider or proof method is approved by this ADR. Provider implementation remains prohibited until separately approved.

## Consequences

Features consume an effective verification projection rather than provider details or a mutable boolean. Support intervention cannot manufacture positive verification without the approved decision path.

## Benefits

- Keeps trust policy auditable and replaceable.
- Supports expiry, provider outages, disputes and recovery.
- Prevents downstream features from coupling to one proof mechanism.

## Risks

- Evidence collection may create sensitive data and support burden.
- Incorrect expiry or provider policy could revoke legitimate access or retain stale trust.

## Alternatives considered

- Permanent verified boolean: rejected because it lacks provenance and revocation.
- Provider-specific fields on Character Link: rejected because it couples identity to one provider.
- Manual support-only verification: retained only as a possible provider category, not approved as the sole model.

## Security impact

Proof must be replay-resistant, time-bounded where possible and server-validated. Competing claims freeze high-risk permissions. Passwords, bearer tokens, browser secrets, disabled TLS and unsupported automation are prohibited.

## Privacy impact

Evidence uses data minimisation, restricted storage/access, classification-based retention and owner-safe summaries. Evidence content never enters public projections or routine logs.

## Operational impact

Requires provider health, expiry processing, reviewer procedures, dispute SLAs, revocation propagation and recovery runbooks before production use.

## Migration impact

Existing positive labels require evidence classification and default to linked/unverified when provenance is insufficient. No evidence table or migration is authorised yet.

## Dependencies

[ADR-0101](./ADR-0101-separate-link-from-verified-ownership.md), [ADR-0116](./ADR-0116-player-data-classification-retention.md), [ADR-0118](./ADR-0118-support-intervention-model.md), [ADR-0119](./ADR-0119-player-audit-immutable-history.md).

## Validation required

Threat-model each proposed provider; test replay, expiry, revocation, dispute, competing claims, evidence access, reviewer separation, recovery and immediate downstream invalidation.

## Revisit triggers

Revisit when an authorised provider or federation becomes available, the proof threat model changes, or privacy/retention obligations change.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md), [Approval Matrix](../PLAYER_DOMAIN_APPROVAL_MATRIX.md).
