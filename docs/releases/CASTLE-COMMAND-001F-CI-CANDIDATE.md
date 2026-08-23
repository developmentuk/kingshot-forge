# CASTLE-COMMAND-001F — Final CI Candidate Procedure

This file records the deliberate CI-only `main` retarget for PR #94 after correction of fresh independent Codex finding F16/P1.

Candidate parent before this evidence commit:

`093bb7c4e4d9962498f5a02dcece086ae2a13223`

The resulting commit is the frozen corrected CASTLE-COMMAND-001F candidate to be validated against the canonical `main` baseline `40c581eb20fa145c20efe0634b3e07e9c273a581`.

The governed release chain now contains **25 Castle Command migrations**. The latest release-hardening migration is:

`20260823170000_castle_command_assignment_snapshot_serialization.sql`

F16 closes the remaining assignment source-snapshot serialization boundary:

- assignment creation follows `session -> membership -> account -> profile -> timing`;
- the exact player-account row is locked before identity snapshots are read;
- the explicitly shared profile remains locked before Howler/share state is read;
- the exact selected timing row is locked before `march_seconds` is derived;
- `profile_updated_at_snapshot` is populated from `greatest(command_profile.updated_at, timing.updated_at)` so direct timing-row updates are represented;
- this order preserves account-to-profile cascade direction and profile-to-timing save direction.

The authoritative final release-order/review addendum is:

`docs/releases/CASTLE-COMMAND-001F-F16-RELEASE-ADDENDUM.md`

No Castle Command production migration, Realtime policy, production data mutation or merge is authorised by this CI retarget.

Required validation on the exact resulting head:

- permanent Castle Command tests 001A–001F plus F13, F14, F15 and F16 focused regressions and the governed 25-migration order;
- full Vision integration validation;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- lint;
- production TypeScript/Vite build.

Validation results are to be recorded in PR #94 metadata/comment after the workflows finish rather than by another source commit, so the validated head remains exact.

After validation, PR #94 must be restored to its 001E stacked base. F8–F16 review threads remain review-gated until a fresh exact-head Codex pass confirms the corrected candidate.

Production activation remains **STOPPED** pending clean independent exact-head review and real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated Realtime and role acceptance.
