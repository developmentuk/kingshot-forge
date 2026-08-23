# CASTLE-COMMAND-001F — Final CI Candidate Procedure

This file records the deliberate CI-only `main` retarget for PR #94 after correction of fresh independent Codex finding F14/P1 and the related self-found F15 cascade-order gap.

Candidate parent before this evidence commit:

`c38c6350876f9b3b65a6c3f4b4ca5273991d53dd`

The resulting commit is the frozen corrected CASTLE-COMMAND-001F candidate to be validated against the canonical `main` baseline `40c581eb20fa145c20efe0634b3e07e9c273a581`.

The governed release chain now contains **24 Castle Command migrations**. The latest release-hardening migrations are:

- `20260823165000_castle_command_ack_assignment_lock_order.sql`
- `20260823165500_castle_command_reset_assignment_lock_order.sql`

F14/F15 close the remaining assignment-cascade lock-order boundary:

- participant READY/SENT now follows `session -> membership + assignment authority -> acknowledgement`;
- manager/deputy reset follows `session -> target assignment -> locked command authority -> acknowledgement`;
- both paths therefore acquire the parent assignment before acknowledgement state, matching FK cascade deletion;
- F13 continues to lock the concrete deputy/participant authority records and tactical assignment snapshot.

The authoritative final release-order/review addendum is:

`docs/releases/CASTLE-COMMAND-001F-F15-RELEASE-ADDENDUM.md`

No Castle Command production migration, Realtime policy, production data mutation or merge is authorised by this CI retarget.

Required validation on the exact resulting head:

- permanent Castle Command tests 001A–001F plus F13, F14 and F15 focused regressions and the governed 24-migration order;
- full Vision integration validation;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- lint;
- production TypeScript/Vite build.

Validation results are to be recorded in PR #94 metadata/comment after the workflows finish rather than by another source commit, so the validated head remains exact.

After validation, PR #94 must be restored to its 001E stacked base. F8–F15 review threads remain review-gated until a fresh exact-head Codex pass confirms the corrected candidate.

Production activation remains **STOPPED** pending clean independent exact-head review and real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated Realtime and role acceptance.
