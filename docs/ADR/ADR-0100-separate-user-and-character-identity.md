# ADR-0100: Separate Forge User and Game Character identity

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player Domain architecture
- **Approval required from:** Clark and Aegis; Security and Privacy review

## Context

Supabase Auth identifies a Forge user. Kingshot Player IDs identify game characters. Current Forge code places user association, observed character fields and verification-like labels together, making authentication appear stronger than it is and making multiple characters difficult to model safely.

## Decision

Forge User Identity and Game Character Identity will be separate bounded concepts. An observed character exists independently of a Forge user. A time-bounded Character Link associates them without changing either identity. User authentication proves control of the Forge account only; it never proves ownership of a game character.

## Consequences

Player-facing features resolve both an authenticated actor and an explicit character. Unlinking ends the association without deleting the observed character or rewriting historical actions.

## Benefits

- Supports multiple characters and ownership history without duplicating Forge users.
- Prevents authentication, profile and game-identity concepts from granting each other's permissions.
- Gives downstream domains a stable character subject.

## Risks

- Existing `player_accounts` responsibilities require careful compatibility mapping.
- UI and services that assume one primary row must be migrated incrementally.

## Alternatives considered

- One combined user/player record: rejected because one user may control several characters.
- Character as the authentication principal: rejected because Forge authentication and game identity have different trust sources.
- Duplicate user accounts per character: rejected because it fragments preferences, consent and audit.

## Security impact

Every sensitive action must bind the server-derived Forge actor to an authorised Character Link. Route identifiers or browser claims cannot establish ownership.

## Privacy impact

Internal Forge user IDs and external Player IDs remain separate sensitive identifiers. Public projections must not expose their relationship.

## Operational impact

Support and audit tooling must search by opaque case/resource references and avoid presenting a combined identity as a single mutable record.

## Migration impact

Requires approved schema discovery and a staged split of observed character data from user-character associations. No migration is authorised by this ADR.

## Dependencies

[ADR-0101](./ADR-0101-separate-link-from-verified-ownership.md), [ADR-0109](./ADR-0109-server-authoritative-player-operations.md) and [ADR-0115](./ADR-0115-player-schema-recovery-strategy.md).

## Validation required

Test zero, one and many characters per user; one character with former links; cross-user access; unlink/relink history; and public projections without Forge user identifiers.

## Revisit triggers

Revisit if Kingshot supplies an approved identity federation, Forge changes authentication provider, or character identity ceases to be stable.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Glossary](../PLAYER_DOMAIN_GLOSSARY.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md).
