# ADR-0115: Recover the Player schema baseline before forward migrations

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player architecture and Database review
- **Approval required from:** Clark and Aegis; Database, Security and Operations review

## Context

Checked-in migrations do not create the Player, base Hero, Kingdom, Alliance, Transfer, view or RPC objects referenced by current application code. Treating application types as the production schema would make forward migrations unsafe and irreproducible.

## Decision

Player schema recovery precedes forward implementation. A named, approved operator will perform read-only discovery against an explicitly identified environment; capture a sanitised, hashed inventory; compare it with application expectations; reconstruct it in a disposable environment; review a non-destructive baseline/history-alignment plan; and only then design forward-only hardening migrations with rollback or compensation.

No live discovery, schema change, migration repair or production write is authorised by this Proposed ADR.

## Consequences

Schema-dependent implementation remains blocked until evidence and approvals exist. Database defaults, Data API exposure, grants, RLS, views and functions are never assumed from project age or application behaviour.

## Benefits

- Establishes reproducible source control before structural change.
- Reduces destructive assumptions and migration-history drift.
- Gives security review the actual grants/RLS/function surface.

## Risks

- Discovery may reveal substantial drift or orphan data.
- Incorrect baseline alignment could desynchronise environments.
- Sensitive metadata must be handled without capturing production rows or secrets.

## Alternatives considered

- Recreate objects from application types: rejected as guesswork.
- Ignore history and add forward migrations: rejected because conflicts and security gaps are likely.
- Destructive production reset: prohibited.

## Security impact

Inventory includes owners, grants, default privileges, RLS flags/policies, view security and function execution/search-path posture. Evidence excludes secrets and production row content.

## Privacy impact

Schema evidence is access-controlled and minimised. Column names/classification may themselves reveal sensitive design and require restricted handling.

## Operational impact

Requires environment proof, backup/restore rehearsal, exact hashes, stop conditions, monitoring and a named rollback owner before production alignment.

## Migration impact

Baseline recovery and new Player features are separate migration phases. Alignment is rehearsed on a clone/disposable environment; production never executes descriptive create/drop statements for objects already present.

## Dependencies

Clark/Aegis discovery approval, identified Supabase target, accepted evidence location and current Supabase CLI/documentation review at execution time.

## Validation required

Compare schema inventory hashes; reconstruct on disposable Postgres; validate constraints, indexes, triggers, grants, RLS, views, functions and migration history; rehearse forward and rollback/compensation paths.

## Revisit triggers

Revisit if an authoritative schema export/history is recovered, Supabase changes migration/Data API defaults, or the target environment changes.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Implementation Entry Criteria](../PLAYER_DOMAIN_IMPLEMENTATION_ENTRY_CRITERIA.md), [Supabase Data API security guidance](https://supabase.com/docs/guides/api/securing-your-api), [Supabase changelog](https://supabase.com/changelog?tags=breaking-change).
