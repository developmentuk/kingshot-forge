# ADR-0106: Model Kingdom membership as effective-dated terms

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Kingdom Domain with Player identity validation
- **Approval required from:** Clark and Aegis; Security and Privacy review

## Context

External lookup can report a character's Kingdom at one moment but does not prove current residence or its history. Forge currently cannot reproduce the persistence and rules behind its Kingdom membership projections.

## Decision

Kingdom Membership is represented by effective-dated Kingdom Membership Terms with explicit state: observed, claimed, confirmed current, former or disputed. Start and end are preserved. External observations can inform review but cannot promote themselves to confirmed membership. A transfer ends the prior term and creates a new observed or claimed candidate before confirmation.

## Consequences

Current membership is a derived effective term, not a mutable field on the character. History remains available under approved visibility and retention policy.

## Benefits

- Distinguishes observation, assertion and trusted membership.
- Supports transfers and disputes without rewriting history.
- Gives Alliance eligibility a stable prerequisite.

## Risks

- Stale or conflicting evidence can leave membership unresolved.
- Confirmation policy and authoritative sources are not yet approved.

## Alternatives considered

- Latest lookup wins: rejected because observation is not authority.
- Mutable current Kingdom field: rejected because it loses history and disputes.
- User self-declaration only: retained as `claimed`, never as confirmed authority.

## Security impact

Only an approved reviewer/provider policy can confirm a term. Client updates cannot grant Kingdom-scoped or Alliance permissions.

## Privacy impact

Historical residence may expose player movement. Its visibility and retention are no broader than the approved term policy.

## Operational impact

Requires stale-data detection, dispute resolution, transfer sequencing and reconciliation between observations and confirmed terms.

## Migration impact

Existing rows require evidence classification and effective-date reconstruction. Lookup-created rows default to observed when proof is insufficient.

## Dependencies

[ADR-0101](./ADR-0101-separate-link-from-verified-ownership.md), [ADR-0115](./ADR-0115-player-schema-recovery-strategy.md), and Kingdom Domain approval.

## Validation required

Test observation changes, claims, confirmation, transfers, overlapping terms, disputes, stale data, former history and Alliance eligibility without confirmed membership.

## Revisit triggers

Revisit when Kingshot offers an authoritative membership source or Kingdom policy permits a different confirmation model.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Glossary](../PLAYER_DOMAIN_GLOSSARY.md), [Alliance separation ADR](./ADR-0107-alliance-application-membership-rank-separation.md).
