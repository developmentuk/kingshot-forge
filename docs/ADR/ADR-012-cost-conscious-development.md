# ADR-012: Cost-Conscious Development

- **Status:** Accepted
- **Decision date:** 23 July 2026
- **Reconciled:** 13 August 2026
- **Decision owner:** Clark
- **Applies to:** Kingshot Forge engineering, infrastructure and delivery

## Context

Forge is independently operated and should not acquire recurring infrastructure
costs merely for development convenience. Paid preview databases, metered cloud
branches and similar resources may be useful, but their cost and lifecycle must
remain an owner decision.

## Decision

Forge prefers this delivery order where it remains safe and maintainable:

1. local development and validation;
2. isolated Git branches and reviewable pull requests;
3. version-controlled migrations and configuration;
4. explicit owner review;
5. controlled use of existing environments;
6. post-deployment verification and rollback readiness.

Unless the owner explicitly approves otherwise:

- do not create paid Supabase branches or preview databases;
- do not provision metered infrastructure for convenience;
- explain the expected price and billing basis before creating a paid resource;
- use existing repository, local and free-tier controls where suitable;
- do not weaken security, integrity, recovery or testing merely to avoid cost.

## Exceptions

A paid resource may be used when the owner approves the cost, the benefit cannot
reasonably be achieved through the default workflow, and an exit or cost-control
plan is recorded.

## Consequences

- Infrastructure spend remains intentional and visible.
- Git history remains the principal development audit trail.
- Some rehearsals require additional manual review and stronger rollback plans.
- The absence of a paid rehearsal environment increases, rather than reduces,
  the importance of backups and production gates.

## Provenance

Recovered from PR #17 during the Version 1.1.0 repository re-baseline. This ADR
is subordinate to `docs/AEGIS.md` and does not authorise infrastructure changes.

## Related records

- `docs/ADR/ADR-013-safe-database-migration-workflow.md`
- `docs/AEGIS.md`
- `governance/RELEASE_PROCESS.md`
