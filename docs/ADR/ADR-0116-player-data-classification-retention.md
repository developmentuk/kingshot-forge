# ADR-0116: Classify Player data before setting retention

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player privacy architecture
- **Approval required from:** Clark and Aegis; Privacy, Security and Operations review

## Context

Player data ranges from public aliases to verification evidence, Alliance authority, transfer contact details and immutable security audit. One retention period or deletion behaviour cannot serve every purpose safely.

## Decision

Player data is classified by sensitivity and purpose before retention is approved. Minimum classes are public identity projection, private/internal identity, verification evidence, membership/Alliance authority, transfer contact, consent/provider eligibility, operational Planning data and restricted audit/security evidence. Each class records purpose, audience, source, retention, deletion/pseudonymisation, export, legal/security hold and account-closure treatment.

## Consequences

Retention periods remain Proposed until Privacy/Security approval. Deletion does not rewrite immutable business/security history; identifiers are minimised or pseudonymised when the purpose no longer requires direct identity.

## Benefits

- Proportionate privacy and support evidence.
- Clear account deletion/export behaviour.
- Prevents public or contact data from inheriting indefinite audit retention.

## Risks

- Complex deletion and hold interactions.
- Over-retention increases breach impact; under-retention weakens disputes and security investigations.

## Alternatives considered

- Keep everything indefinitely: rejected as disproportionate.
- Delete everything immediately: rejected because active contracts, disputes and security evidence may require retention.
- One global duration: rejected because purposes and sensitivity differ.

## Security impact

Restricted evidence and audit have least-privilege access, access logging and integrity controls. Holds cannot become hidden indefinite retention.

## Privacy impact

Purpose limitation, minimisation, consent withdrawal, export and account closure are explicit per class. Public exposure is not a retention justification.

## Operational impact

Requires scheduled expiry, legal/security hold governance, deletion verification, subject-request procedures and monitoring for orphaned sensitive data.

## Migration impact

Existing columns/rows require classification before migration. Data without an approved purpose is quarantined, redacted or excluded rather than copied automatically.

## Dependencies

[ADR-0104](./ADR-0104-character-verification-model.md), [ADR-0111](./ADR-0111-transfer-domain-boundary.md), [ADR-0119](./ADR-0119-player-audit-immutable-history.md).

## Validation required

Data inventory, access matrix, retention/deletion simulations, account closure/export cases, consent withdrawal, dispute/security hold and restoration/backup treatment.

## Revisit triggers

Revisit when legal obligations, product purposes, providers, jurisdictions or account/subscription policies change.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md), [Approval Matrix](../PLAYER_DOMAIN_APPROVAL_MATRIX.md).
