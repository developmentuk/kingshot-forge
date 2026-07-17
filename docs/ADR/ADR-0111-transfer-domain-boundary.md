# ADR-0111: Separate Transfer listing, contact and verification

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Transfer Domain
- **Approval required from:** Clark and Aegis; Security, Privacy and Operations review

## Context

Current Transfer data mixes public listing fields, private notes and contact details and only requires a linked primary character while presenting stronger identity language. Expiry, withdrawal, consent and retention are undefined.

## Decision

A Transfer Listing is a verified-character-owned lifecycle record with an allowlisted public/scoped projection. Transfer Contact Details are a separate private/restricted record disclosed only under approved consent and recruiter authority. Listing verification, publication, expiry, withdrawal and archival are independent of contact retention.

## Consequences

Linking alone is insufficient to publish a verified Transfer listing. Withdrawal removes active contact access immediately; historical audit follows approved retention without keeping contact available.

## Benefits

- Reduces accidental contact disclosure.
- Gives listing and consent clear lifecycles.
- Supports safe public recruitment without leaking internal identity.

## Risks

- Recruiter workflows become more complex.
- Incorrect retention or stale membership can expose sensitive contact data.

## Alternatives considered

- One table/row for all fields: rejected because public projection mistakes become high impact.
- Public contact by default: rejected as disproportionate.
- Link-only eligibility: rejected because ownership is unproven.

## Security impact

Contact reads require current actor, purpose, consent and scoped recruiter capability. Sensitive reads are rate-limited and auditable; public routes use opaque aliases.

## Privacy impact

Contact, private notes and transfer preferences receive explicit classification, consent, retention and deletion rules. Public listing fields are independently allowlisted.

## Operational impact

Requires expiry, withdrawal, contact-access review, abuse reporting and support procedures that do not reveal contact without case need.

## Migration impact

Existing Transfer records require verified-owner classification and public/private field split. No automatic publication occurs during migration.

## Dependencies

[ADR-0101](./ADR-0101-separate-link-from-verified-ownership.md), [ADR-0105](./ADR-0105-public-identity-and-visibility.md), [ADR-0116](./ADR-0116-player-data-classification-retention.md).

## Validation required

Test unverified/revoked owners, expiry, withdrawal, consent revocation, wrong recruiter, former membership, public field canaries, retention and access audit.

## Revisit triggers

Revisit when Transfer product stages, recruiter roles or legal/privacy retention requirements change.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Glossary](../PLAYER_DOMAIN_GLOSSARY.md), [Approval Matrix](../PLAYER_DOMAIN_APPROVAL_MATRIX.md).
