# CASTLE-COMMAND-001F — Final CI Candidate Procedure

This file records the deliberate CI-only `main` retarget for PR #94 after correction of fresh independent Codex finding F17/P1.

Candidate parent before this evidence commit:

`4a2225f9a3c91964df7cfe41c83db8860b5a1de4`

The resulting commit is the frozen corrected CASTLE-COMMAND-001F candidate to be validated against the canonical `main` baseline `40c581eb20fa145c20efe0634b3e07e9c273a581`.

The governed release chain now contains **26 Castle Command migrations**. The latest release-hardening migration is:

`20260823170500_castle_command_tactical_snapshot_session_lock_order.sql`

F17 closes the remaining tactical-version snapshot-guard lock-order inversion:

- the BEFORE INSERT tactical snapshot guard explicitly locks the exact Castle session first, including null-auth service/migration inserts;
- it then locks session assignment rows in deterministic assignment-ID order;
- the canonical assignment snapshot is rebuilt only after those locks;
- snapshot drift still fails with SQLSTATE `40001`;
- this aligns the trigger with the global Castle `session -> assignments` order and removes the prior `assignment -> session` / `session -> assignment` `40P01` cycle.

The authoritative final release-order/review addendum is:

`docs/releases/CASTLE-COMMAND-001F-F17-RELEASE-ADDENDUM.md`

No Castle Command production migration, Realtime policy, production data mutation or merge is authorised by this CI retarget.

Required validation on the exact resulting head:

- permanent Castle Command tests 001A–001F plus F13–F17 focused regressions and the governed 26-migration order;
- full Vision integration validation;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- lint;
- production TypeScript/Vite build.

Validation results are to be recorded in PR #94 metadata/comment after the workflows finish rather than by another source commit, so the validated head remains exact.

After validation, PR #94 must be restored to its 001E stacked base. F8–F17 review threads remain review-gated until a fresh exact-head Codex pass confirms the corrected candidate.

Production activation remains **STOPPED** pending clean independent exact-head review and real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated Realtime and role acceptance.
