# ADR-0117: Expose public Player data through safe projections

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player API architecture
- **Approval required from:** Clark and Aegis; Security, Privacy and Database review

## Context

Current public Player reads use browser joins, raw tables/views and identifiers whose grants, RLS and field safety are not reproducible from Git. Supabase grants determine object reachability while RLS determines permitted rows; neither automatically defines a stable field-level public contract.

## Decision

Public Player data is available only through versioned, allowlisted safe projections keyed by opaque public identifiers. Sensitive Player mutations and context-sensitive reads use authenticated server APIs. Direct raw-table access by `anon` is denied. Any public database view must be purpose-specific, field-minimal, explicitly granted, reviewed for invoker/security behaviour and backed by RLS where exposed.

## Consequences

Public aliases, contract versions, rate limits, deprecation and cache policy become explicit. The implementation may choose server projection APIs, reviewed Data API views or a hybrid only after schema discovery; raw tables are not a public contract.

## Benefits

- Reduces enumeration, IDOR and accidental field leakage.
- Stable versioning independent of physical schema.
- Clear grants/RLS/cache review surface.

## Risks

- Additional server/runtime and caching responsibility.
- Incorrect cache variation or stale invalidation can expose revoked data.

## Alternatives considered

- Raw table access with RLS: rejected as insufficient for field allowlisting and contract stability.
- Public external Player ID routes: rejected pending explicit exposure approval.
- Disable every Data API use immediately: deferred until existing consumers and schema are inventoried.

## Security impact

Uniform not-found responses, opaque aliases, bounded search/rate limits, explicit grants, RLS, safe view posture and cache partitioning are required. Service-role keys never enter clients.

## Privacy impact

Only purpose-approved fields are projected. Visibility revocation triggers cache purge/invalidation, and public access never reveals the Forge user-character relationship.

## Operational impact

Requires contract observability, abuse controls, cache purge, alias rotation, deprecation windows and incident response.

## Migration impact

Existing public views/routes need inventory and compatibility redirects. Direct reads are removed only after replacement projections pass negative-access and field-canary tests.

## Dependencies

[ADR-0105](./ADR-0105-public-identity-and-visibility.md), [ADR-0109](./ADR-0109-server-authoritative-player-operations.md), [ADR-0115](./ADR-0115-player-schema-recovery-strategy.md).

## Validation required

Anonymous/authenticated matrices, object grants, RLS, view security, field allowlists, enumeration/rate tests, cache isolation/invalidation, alias rotation and version deprecation.

## Revisit triggers

Revisit after schema discovery, Data API configuration changes or a new public consumer requires a documented contract.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Data API guidance](https://supabase.com/docs/guides/api/securing-your-api).
