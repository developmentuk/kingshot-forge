# ADR-0119: Append immutable Player audit history

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player audit and security architecture
- **Approval required from:** Aegis and Clark; Security, Privacy, Operations and Database review

## Context

Identity, verification, membership, authority, visibility, consent, Transfer and support changes affect trust and access. Mutable “updated by” fields cannot explain transitions or support disputes, and Editorial audit records have different ownership and sensitivity.

## Decision

Sensitive Player state changes append immutable audit evidence containing action, actor type/reference, subject, resource type/reference, safe before/after summaries, reason, correlation/idempotency reference, environment, policy revision, support marker and occurrence time. Audit is domain-owned and separate from Editorial history. Corrections append compensating events; records are not rewritten or deleted through product workflows.

## Consequences

Audit payloads are purpose-specific and minimised, not raw request/response dumps. Access is restricted and audited. Retention/pseudonymisation may reduce direct identifiers while preserving event integrity under approved policy.

## Benefits

- Reconstructs sensitive lifecycle and authority decisions.
- Supports incident response, disputes and idempotency reconciliation.
- Prevents support or operators from hiding history.

## Risks

- Audit can become a high-value sensitive dataset.
- Excessive payloads create privacy and cost problems; insufficient summaries reduce utility.

## Alternatives considered

- Mutable history fields: rejected because prior state is lost.
- Reuse Editorial audit table: rejected because domains, access and retention differ.
- Log-only audit: rejected because application logs are not durable business evidence.

## Security impact

Insert is server-controlled; update/delete are denied to product roles. Integrity, access logging, redaction and anomaly monitoring are required. Secrets, tokens, credentials, raw evidence and provider bodies are prohibited.

## Privacy impact

Identifiers and summaries are minimised and classified. Subject export/deletion rules distinguish business/security evidence from unnecessary personal detail.

## Operational impact

Requires audit taxonomy ownership, correlation, storage monitoring, access review, incident export and restore/integrity testing.

## Migration impact

Existing history is imported only when provenance is trustworthy. No synthetic events claim actions that cannot be evidenced. New audit persistence waits for schema recovery.

## Dependencies

[ADR-0109](./ADR-0109-server-authoritative-player-operations.md), [ADR-0116](./ADR-0116-player-data-classification-retention.md), [ADR-0115](./ADR-0115-player-schema-recovery-strategy.md).

## Validation required

Test append-only privileges, actor/subject separation, safe before/after summaries, transaction atomicity, correlation/idempotency, support markers, redaction, retention/pseudonymisation and audit-of-audit.

## Revisit triggers

Revisit when legal/security retention changes, an integrity service is adopted or a cross-domain audit platform provides equivalent isolation and semantics.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md), [Approval Matrix](../PLAYER_DOMAIN_APPROVAL_MATRIX.md).

## Sprint 9.3 implementation evidence

Immutable in-process event contracts and a deep-freezing factory reject sensitive metadata and remain unpublished. No event store, transport or database write exists; retention and production audit design remain open, so this ADR remains **Proposed**.
