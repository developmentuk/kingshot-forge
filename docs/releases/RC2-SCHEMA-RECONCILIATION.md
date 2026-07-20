# RC2 Supabase Editorial Schema Reconciliation

Date: 19 July 2026  
Project: `hrvdhjscwitqpwjhnjkm`  
Branch HEAD before RC2 changes: `114f2ccc8d528af610a51a653a0d77a4c5a1ef56`

## Findings

The live project already contains the canonical PM2B editorial tables and
`commit_editorial_version(jsonb, jsonb, jsonb, integer)`, with the expected
columns, primary keys, foreign keys, uniqueness constraints, indexes and RLS
enabled. The migration history does not list the original PM2B migration, so
the checked-in canonical publication-security migration is being applied as a
reconciliation rather than creating parallel tables.

The live project still has unrestricted authenticated read policies on the
editorial tables, lacks `publish_editorial_queue_item`, and lacks an atomic
rollback function. No conflicting object names were found.

## Applied migration sequence

1. Reapply the checked-in `20260717170000_secure_atomic_editorial_publication.sql`
   under a reconciliation migration name. This replaces unrestricted reads,
   restores the canonical atomic Heroes/Hero Skills publication RPC and keeps
   service-role access server-only.
2. Apply `20260719000000_rc2_editorial_platform_completion.sql`. This adds the
   permission helper, useful actor/status/time indexes, append-only history
   triggers and the atomic rollback RPC. It does not delete, rewrite or
   migrate existing editorial rows.
3. Apply `20260719001000_rc2_editorial_function_privilege_hardening.sql` to
   remove legacy `anon` and `authenticated` execution grants from the existing
   commit RPC while retaining server-side service-role execution.

## Rollback strategy

The migration is transactional. If application fails, the database transaction
rolls back. The rollback RPC never rewrites or deletes a historical version; it
inserts a new monotonic `published` version and audit event whose metadata
identifies the target version.

## Verification plan

Labelled reversible fixtures verified object signatures, policies, RLS, atomic
publication failure behaviour, immutable history and rollback. The transaction
was rolled back and the post-check reported zero remaining RC2 fixture rows in
versions, heads, audit events, queue items and schedules.
