# ADR-0101: Separate character links from verified ownership

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Character Verification boundary
- **Approval required from:** Clark and Aegis; Security and Privacy review

## Context

Current lookup and linking can establish that a Player ID resolves to a visible character, but cannot prove that the signed-in Forge user controls it. Treating a successful link as ownership would enable profile, Transfer, Gift Centre or Alliance actions against another person's character.

## Decision

A Character Link is an asserted association and is unverified by default. Verified ownership exists only while a current, server-authoritative Verification Decision is effective. Link state and verification state are evaluated independently. Expiry, revocation or dispute removes verified-only eligibility without erasing the link or its history.

## Consequences

Every feature declares whether linked or verified state is required. UI labels must not use “verified” for lookup, refresh or linking success.

## Benefits

- Prevents accidental privilege from a public identifier lookup.
- Supports revocation, disputes and recovery without destructive edits.
- Allows useful low-risk linked features while high-risk features remain gated.

## Risks

- Users may perceive verification friction.
- Existing verification-like labels may not have enough evidence to migrate as verified.

## Alternatives considered

- Link equals ownership: rejected as insecure.
- Verification boolean on the link: rejected because it loses evidence, decision, expiry and dispute history.
- Feature-specific ownership checks: rejected because trust semantics would drift.

## Security impact

Verified-only operations re-evaluate the effective decision, expiry, dispute and revocation at execution time. Positive labels without evidence default to unverified during migration.

## Privacy impact

Verification evidence is restricted and minimised. Owner-facing status omits reviewer identity, evidence content and competing claimant details.

## Operational impact

Support requires explicit dispute and recovery procedures. Downstream systems consume revocation events and still re-check current state.

## Migration impact

Existing link and verification-like fields require evidence classification. Unsupported positive states become linked/unverified with restricted legacy audit metadata.

## Dependencies

[ADR-0100](./ADR-0100-separate-user-and-character-identity.md), [ADR-0104](./ADR-0104-character-verification-model.md) and [ADR-0119](./ADR-0119-player-audit-immutable-history.md).

## Validation required

Cover linked-unverified, pending, verified, expired, revoked, disputed, recovered, former-owner and conflicting-claim scenarios across every verified-only consumer.

## Revisit triggers

Revisit only if an approved authoritative provider supplies a stronger direct ownership assertion with equivalent revocation and audit guarantees.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Glossary](../PLAYER_DOMAIN_GLOSSARY.md), [Gift Centre boundary ADR](./ADR-0112-gift-centre-integration-boundary.md).

## Sprint 9.3 implementation evidence

Character Link and Character Ownership Verification are separate contracts. Sensitive test resolution rejects a linked/unverified character. No live positive claim or provider exists; this ADR remains **Proposed**.
