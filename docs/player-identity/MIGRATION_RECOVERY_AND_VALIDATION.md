# Player Identity migration recovery, validation and rollback

**Status:** Proposed plan; no migration was created or applied. The SQL design artifact is [player-identity-replacement-schema-proposal.sql](../reference/player-identity-replacement-schema-proposal.sql) and remains outside `supabase/migrations`.

## Recovery sequence

1. Freeze Player schema changes and export read-only inventories of live migrations, tables, constraints, views, grants, policies, functions, ownership and row counts.
2. Reconcile the eight live migration records found at discovery against the five checked-in files. Reconstruct the three missing records from immutable deployment evidence; do not invent order or content.
3. Fingerprint the accepted baseline and record Clark/Aegis, Database, Security and Privacy approval. Any drift after fingerprinting aborts rehearsal.
4. Review every broad grant and permissive policy; enumerate all `SECURITY DEFINER` functions, owners, `search_path` settings and PUBLIC/anon/authenticated EXECUTE privileges.
5. Classify legacy `player_accounts`, `player_profiles`, Kingdom/Alliance memberships, public views and verification fields. Legacy “verified” remains `unverified` for Character Ownership Verification.
6. Reconcile one-user/one-character uniqueness into explicit Forge User, Game Character and Character Link mappings. Ambiguous owners or duplicate current links abort.
7. Rehearse the guarded proposal in an isolated clone only. Capture pre/post counts, constraints, foreign-key integrity, aliases, revisions, audits, grants/RLS and safe projection snapshots.
8. Run owner, anonymous, authenticated, support and server-role denial/allowance tests. Confirm whole-row public views and unsafe Alliance fields are unreachable.
9. Test rollback from snapshot and a forward-fix path; measure outage, cache invalidation and public-profile purge behavior.
10. Produce signed migration and rollback receipts. Only then may an approved migration replace the proposal’s guard and terminal `ROLLBACK`.

## Non-production validation matrix

- Baseline: migration count/order/checksums, extensions/Postgres version, schema object ownership and drift.
- Data: row counts, nulls, duplicates, orphaned FKs, current-link conflicts, Primary ownership, legacy verification demotion, alias collisions and audit continuity.
- Security: explicit grants, no browser privilege on the private schema, RLS enabled, server-only safe projection, no wildcard whole-row exposure, function EXECUTE/search path and service-key isolation.
- Behaviour: links, limits, Primary invariant, exact Active context, default-deny visibility, aliases, public projection, adapters, disputes and four-eyes rejection paths.
- Operations: backup/restore, rollback duration, read-only compatibility window, monitoring, cache purge, support runbook and incident owner.

## Abort conditions

Abort for unreconstructed migration history, baseline drift, ambiguous ownership, duplicate current owners, reconciliation mismatch, unsafe public view/policy, incomplete function review, untested rollback, missing receipts, failed privacy/capability tests, or absent Clark/Aegis approval.

## Rollback

Before execution, take a verified point-in-time restore marker and logical reconciliation export. The compatibility phase is additive and read-only. On failure, disable all Player flags, stop migration, restore or execute the rehearsed inverse in the approved window, purge public caches, compare audit/count receipts and record the incident. Never write legacy tables during rollback.

## Production release checklist

- [ ] All Proposed Player ADR decisions required by the release are explicitly accepted.
- [ ] Live/checked-in migration history is reconciled and fingerprinted.
- [ ] Non-production rehearsal and rollback have signed receipts.
- [ ] Replacement persistence adapter passes contract and security tests.
- [ ] Capability grants and four-eyes operations are approved.
- [ ] Verification remains OFF until a separate provider/proof/expiry approval.
- [ ] Public profiles remain OFF until privacy, alias enumeration, cache and abuse review.
- [ ] Feature enablement has an owner, staged rollout, telemetry and kill switch.
- [ ] No Player Planning work is included.
