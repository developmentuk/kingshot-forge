# CASTLE-COMMAND-001F — Final CI Candidate Procedure

This file records the deliberate CI-only `main` retarget for PR #94 after correction of the fresh independent Codex P1 assignment/profile-concurrency finding.

Candidate parent before this evidence commit:

`8f1094f445e935e3bba6f87a6c1ae665682c7a9f`

The resulting commit is the frozen corrected CASTLE-COMMAND-001F candidate to be validated against the canonical `main` baseline `40c581eb20fa145c20efe0634b3e07e9c273a581`.

The final governed migration chain now contains 18 Castle Command migrations. The latest release-hardening migration is:

`20260823162500_castle_command_assignment_profile_serialization.sql`

It replaces the assignment RPC so assignment creation retains the session-row lock, then locks the qualifying shared profile row `FOR UPDATE` before reading target timings. Profile saves already own/update that profile row before changing target timings, so opt-out/timing saves and assignment snapshots are serialized through the same profile-row boundary.

No Castle Command production migration, Realtime policy, production data mutation or merge is authorised by this CI retarget.

Required validation on the exact resulting head:

- permanent Castle Command tests 001A–001F, including F7 acknowledgement serialization and F8 assignment/profile serialization;
- full Vision integration validation;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- lint;
- production TypeScript/Vite build.

Validation results are to be recorded in PR #94 metadata/comment after the workflows finish rather than by another source commit, so the validated head remains exact.

After validation, PR #94 must be restored to its 001E stacked base and the unresolved F8 Codex P1 thread must be answered with the exact correction. A fresh exact-head Codex re-review remains mandatory.

Production activation remains STOPPED pending clean independent exact-head review and real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated Realtime and role acceptance.
