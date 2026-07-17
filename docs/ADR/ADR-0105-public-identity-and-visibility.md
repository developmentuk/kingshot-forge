# ADR-0105: Protect public identity with scoped projections

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player Profile and Visibility boundaries
- **Approval required from:** Clark and Aegis; Security and Privacy review

## Context

Current Player visibility is fragmented across booleans and browser joins. Public routes can expose external Player IDs or internal relationships and cannot consistently distinguish Alliance, leadership, owner and restricted audiences.

## Decision

Player records use the canonical visibility scopes `public`, `kingdom`, `alliance`, `leadership`, `private` and `restricted`, subject to entity-specific allowlists. Public and scoped reads are purpose-built projections. Public Character Alias is opaque, non-sequential and separate from the external Player ID and Forge user ID. Default posture is deny and omit.

External Player ID is not public unless Clark, Aegis, Security and Privacy explicitly approve a field-specific policy.

## Consequences

A record's scope does not automatically make every field visible. Server projection policy evaluates current membership, leadership, ownership and restriction before selecting allowlisted fields.

## Benefits

- Consistent privacy language across Player features.
- Reduces enumeration and relationship leakage.
- Supports cache-safe, versioned public contracts.

## Risks

- More projection and negative-authorisation tests are required.
- Scope changes require prompt cache invalidation and may break old public links.

## Alternatives considered

- Public/private boolean: rejected as too coarse.
- Raw table reads with RLS only: rejected because field allowlisting and stable public contracts are also required.
- Public external Player ID as route key: rejected pending explicit risk approval.

## Security impact

Opaque aliases, uniform not-found responses, rate limits, allowlisted fields and no raw joins reduce BOLA/IDOR and enumeration risk. Restricted data is never served from public caches.

## Privacy impact

Visibility changes are explicit, auditable and reversible. Historical and current membership never broaden public identity by inference.

## Operational impact

Projection versions, deprecation windows, cache purge procedures and privacy incident response are required before public release.

## Migration impact

Existing public booleans and Forge-ID routes need staged compatibility and alias creation. Existing views require grant, RLS and field review before reuse.

## Dependencies

[ADR-0116](./ADR-0116-player-data-classification-retention.md), [ADR-0117](./ADR-0117-public-player-data-api-posture.md), [ADR-0109](./ADR-0109-server-authoritative-player-operations.md).

## Validation required

Test anonymous, owner, wrong-owner, Kingdom, Alliance, former-member, leadership, revoked and support audiences; enumeration, cache invalidation and field-canary checks.

## Revisit triggers

Revisit when public Player ID exposure is approved, scopes prove insufficient, or Forge adopts a different public identity service.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Glossary](../PLAYER_DOMAIN_GLOSSARY.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md).
