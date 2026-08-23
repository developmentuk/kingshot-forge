# CASTLE-COMMAND-001F — Final CI Candidate Procedure

This file records the deliberate CI-only `main` retarget for PR #94 after correction of fresh independent Codex finding F13/P1.

Candidate parent before this evidence commit:

`ce20a5f79476a1dcbe4be962b277c88db2910319`

The resulting commit is the frozen corrected CASTLE-COMMAND-001F candidate to be validated against the canonical `main` baseline `40c581eb20fa145c20efe0634b3e07e9c273a581`.

The governed release chain now contains **22 Castle Command migrations**. The latest release-hardening migration is:

`20260823164500_castle_command_authority_record_serialization.sql`

F13 closes the remaining authority-record concurrency boundary identified by exact-head review:

- deputy authority locks both current membership and the exact deputy grant row;
- participant authority locks both current membership and the exact assignment row;
- tactical-version persistence locks concrete assignment rows in deterministic assignment-ID order, rebuilds the canonical snapshot after locking and fails with SQLSTATE `40001` if the snapshot changed;
- null-auth service/migration child-row writes deliberately do not acquire the Castle session row, avoiding a reverse `child row -> session` lock cycle.

The authoritative F13 release-order/review addendum is:

`docs/releases/CASTLE-COMMAND-001F-F13-RELEASE-ADDENDUM.md`

No Castle Command production migration, Realtime policy, production data mutation or merge is authorised by this CI retarget.

Required validation on the exact resulting head:

- permanent Castle Command tests 001A–001F plus the focused F13 authority-record regression and governed 22-migration order;
- full Vision integration validation;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- lint;
- production TypeScript/Vite build.

Validation results are to be recorded in PR #94 metadata/comment after the workflows finish rather than by another source commit, so the validated head remains exact.

After validation, PR #94 must be restored to its 001E stacked base. F8–F13 review threads remain review-gated until a fresh exact-head Codex pass confirms the corrected candidate.

Production activation remains **STOPPED** pending clean independent exact-head review and real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated Realtime and role acceptance.
