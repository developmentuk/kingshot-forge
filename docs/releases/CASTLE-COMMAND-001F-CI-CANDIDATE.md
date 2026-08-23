# CASTLE-COMMAND-001F — Final CI Candidate Procedure

This file records the deliberate CI-only `main` retarget for PR #94 after correction of F12, the final durable write-authority boundary found by the post-F11 release audit.

Candidate parent before the F12 release-evidence update:

`12675a9ea2192808e75c4aa5669e4b7afbce8314`

The resulting exact head after this evidence update is the frozen corrected CASTLE-COMMAND-001F candidate to be validated against the canonical `main` baseline `40c581eb20fa145c20efe0634b3e07e9c273a581`.

The final governed migration chain now contains **21 Castle Command migrations**. The latest release-hardening migration is:

`20260823164000_castle_command_write_authority_boundary.sql`

It closes F12 by:

- revoking authenticated raw `UPDATE` and `DELETE` on `castle_command_sessions` and removing those write policies;
- keeping server-constrained planning-state session creation while re-locking event-manager authority at the insert boundary;
- locking the caller's Forge role row and exact qualifying `alliance_admins` event-management row before durable manager writes;
- enforcing locked manager authority on assignment/deputy persistence;
- enforcing locked manager-or-deputy authority on session lifecycle and tactical persistence;
- enforcing locked command authority for acknowledgement reset and exact locked participant authority for READY/SENT;
- re-locking the session row and rejecting dependent-table writes after close.

This sits on top of F7 acknowledgement serialization, F8 assignment/profile serialization, F9 membership-sensitive write serialization, and F10/F11 deputy/consent serialization.

No Castle Command production migration, Realtime policy, production data mutation or merge is authorised by this CI retarget.

Required validation on the exact resulting head:

- permanent Castle Command tests 001A–001F, including F7–F12 serialization/write-boundary contracts and the 21-migration governed order;
- full Vision integration validation;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- lint;
- production TypeScript/Vite build.

Validation results are to be recorded in PR #94 metadata/comment after the workflows finish rather than by another source commit, so the validated head remains exact.

After validation, PR #94 must be restored to its 001E stacked base. F8–F11 remain review-gated and F12 must be included in a fresh independent exact-head Codex pass before any blocker is treated as cleared.

Production activation remains STOPPED pending clean independent exact-head review and real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated Realtime and role acceptance.
