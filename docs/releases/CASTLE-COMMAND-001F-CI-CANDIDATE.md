# CASTLE-COMMAND-001F — Final CI Candidate Procedure

This file records the deliberate CI-only `main` retarget for PR #94 after correction of the fresh independent Codex P1 membership-transition finding and the equivalent durable-write races found in the follow-up sweep.

Candidate parent before this evidence commit:

`b4ec8c1c24dec8817e5a88aa897f049ec018cfb0`

The resulting commit is the frozen corrected CASTLE-COMMAND-001F candidate to be validated against the canonical `main` baseline `40c581eb20fa145c20efe0634b3e07e9c273a581`.

The final governed migration chain now contains 19 Castle Command migrations. The latest release-hardening migration is:

`20260823163000_castle_command_membership_transition_serialization.sql`

It serializes durable membership-sensitive writes with alliance membership transitions. Assignment uses `session -> target membership -> shared profile`; READY/SENT locks the caller membership after the session; deputy appointment locks the target membership; tactical publication locks all assigned current memberships in deterministic `user_id` order before re-checking eligibility and snapshotting.

No Castle Command production migration, Realtime policy, production data mutation or merge is authorised by this CI retarget.

Required validation on the exact resulting head:

- permanent Castle Command tests 001A–001F, including F7 acknowledgement serialization, F8 assignment/profile serialization and F9 membership-transition serialization;
- full Vision integration validation;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- lint;
- production TypeScript/Vite build.

Validation results are to be recorded in PR #94 metadata/comment after the workflows finish rather than by another source commit, so the validated head remains exact.

After validation, PR #94 must be restored to its 001E stacked base. The superseded F8/F9 Codex threads are to be answered with exact correction evidence and a fresh exact-head Codex re-review remains mandatory before either blocker is treated as cleared.

Production activation remains STOPPED pending clean independent exact-head review and real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated Realtime and role acceptance.
