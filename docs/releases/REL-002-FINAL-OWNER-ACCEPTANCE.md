# REL-002 — Final Owner Acceptance, Buildings Publication & Version 1.0 Go/No-Go

Date: 20 July 2026
Branch: `recovery/0.9.0-rc3-feature-reconciliation`
Starting HEAD: `695642636a9a8880295b4498b166a3329a94e94e`

## Status

**Blocked by genuine owner action.** No approved Owner/Admin, Editorial,
ordinary-player, User A or User B sessions were available in the connected
browser. The exact phrase `Approve Buildings Publication` was not supplied.
Buildings publication was therefore not attempted.

## Phase 1 release-candidate verification

- Import run: `cc925b58-ac6e-4776-875a-1021067118c4`, exactly once, `review_required`.
- Staged records: 10 catalogue and 587 progression records.
- Warning identities: 8 stored and 8 distinct; REL-001 certification passes.
- REL-001 migration: applied and recorded in Supabase as
  `20260720180957 / publication_warning_identity`.
- Published Buildings: 0 catalogue and 0 progression records.
- Working tree: clean at the start of this acceptance attempt.

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

No decision was made. The import run remains `review_required`; no publication
version, audit publication events, search refresh, relationship refresh,
prerequisite graph refresh or rollback was created.

## Recommendation

**Not Ready for Version 1.0.** The next owner action is to provide the approved
sessions, complete the acceptance matrix, explicitly classify the eight
references as `Accepted Structured External Reference / Deferred Catalogue
Dependency`, and issue exactly one decision phrase: `Approve Buildings
Publication`, `Reject Buildings Publication`, or `Return for Corrections`.
