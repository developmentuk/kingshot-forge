# REL-002 — Final Owner Acceptance, Buildings Publication & Version 1.0 Go/No-Go

Date: 20 July 2026
Branch: `recovery/0.9.0-rc3-feature-reconciliation`
Starting HEAD: `695642636a9a8880295b4498b166a3329a94e94e`

## Status

**Blocked by an unsupported publication path.** The owner supplied the exact
phrase `Approve Buildings Publication`, but this branch has no supported atomic
Buildings publication operation. No approved Owner/Admin, Editorial,
ordinary-player, User A or User B sessions were available in the connected
browser either. Buildings publication was therefore not attempted.

## Phase 1 release-candidate verification

- Import run: `cc925b58-ac6e-4776-875a-1021067118c4`, exactly once, `review_required`.
- Staged records: 10 catalogue and 587 progression records.
- Warning identities: 8 stored and 8 distinct; REL-001 certification passes.
- REL-001 migration: applied and recorded in Supabase as
  `20260720180957 / publication_warning_identity`.
- Published Buildings: 0 catalogue and 0 progression records.
- Working tree: clean at the start of this acceptance attempt.

The capability registry marks `buildings.publishing` as unsupported. Content
Studio exposes no Buildings publish action, and the verification registry
expects direct Buildings publication to be rejected. The immutable warning
table has no decision columns or append-only decision-event table, so the
eight approved classifications cannot be persisted safely without adding a
new feature/schema contract outside this REL-002 scope.

## Owner acceptance not run

The following evidence remains unavailable and is not inferred:

- owner/admin review of all eight warnings and their classifications;
- cross-role permission checks;
- User A/User B isolation and fixture cleanup;
- responsive acceptance at 390, 768, 1280 and 1440 pixels;
- backup, rollback, monitoring, incident ownership and alert evidence;
- publication approval and post-publication verification.

The accepted temporary risk remains accurately recorded: leaked-password
protection is not enabled on the Supabase Free plan.

## Publication decision

Owner decision received: `Approve Buildings Publication`. Execution stopped
before mutation because no supported atomic Buildings publication path exists.
The import run remains `review_required`; no publication version, audit
publication events, search refresh, relationship refresh, prerequisite graph
refresh or rollback was created.

## Recommendation

**Not Ready for Version 1.0.** The next engineering action requires explicit
scope approval for an atomic Buildings publication contract, immutable warning
decision persistence, downstream refresh orchestration and rollback support.
The owner approval phrase must be revalidated after that supported path exists.
