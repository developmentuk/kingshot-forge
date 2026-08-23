# CASTLE-COMMAND-001F — Final CI Candidate Procedure

This file records the deliberate CI-only `main` retarget for PR #94 after correction of the fresh independent Codex P1 acknowledgement-concurrency finding.

Candidate parent before this evidence commit:

`88b6e6f9ace6519ba78c12881eec85ca5e4f6f79`

The resulting commit is the frozen corrected CASTLE-COMMAND-001F candidate to be validated against the canonical `main` baseline `40c581eb20fa145c20efe0634b3e07e9c273a581`.

The final governed migration chain now contains 17 Castle Command migrations. The latest release-hardening migration is:

`20260823162000_castle_command_ack_transition_serialization.sql`

It replaces the participant READY/SENT RPC so acknowledgement transitions acquire the session row `FOR UPDATE` before lifecycle and authority validation and lock existing acknowledgement state before transition validation. This serializes participant acknowledgement mutation with session closure and manager acknowledgement reset.

No Castle Command production migration, Realtime policy, production data mutation or merge is authorised by this CI retarget.

Required validation on the exact resulting head:

- permanent Castle Command tests 001A–001F, including the F7 acknowledgement-serialization regression;
- full Vision integration validation;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- lint;
- production TypeScript/Vite build.

Validation results are to be recorded in PR #94 metadata/comment after the workflows finish rather than by another source commit, so the validated head remains exact.

After validation, PR #94 must be restored to its 001E stacked base and the unresolved Codex P1 thread must be answered with the exact correction. A fresh exact-head Codex re-review remains mandatory.

Production activation remains STOPPED pending clean independent exact-head review and real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated Realtime and role acceptance.
