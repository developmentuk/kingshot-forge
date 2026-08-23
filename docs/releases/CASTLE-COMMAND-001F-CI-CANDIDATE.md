# CASTLE-COMMAND-001F — Final CI Candidate Procedure

This file records the deliberate CI-only `main` retarget for PR #94 after correction of the fresh independent Codex F10/P1 deputy-authority race and F11/P2 sharing-consent race.

Candidate parent before this evidence commit:

`bc7b404acf0aee5f1ef33524ef582b2e122edc31`

The resulting commit is the frozen corrected CASTLE-COMMAND-001F candidate to be validated against the canonical `main` baseline `40c581eb20fa145c20efe0634b3e07e9c273a581`.

The final governed migration chain now contains 20 Castle Command migrations. The latest release-hardening migration is:

`20260823163500_castle_command_deputy_consent_serialization.sql`

It closes the remaining membership-transition boundaries identified by exact-head review:

- deputy lifecycle/reset mutations use `session -> deputy caller membership` when authority depends on a deputy grant;
- the explicit profile-sharing save locks the exact current owner membership before persisting consent;
- the compatibility sharing overload locks currently qualifying memberships in deterministic `alliance_id` order, verifies exactly one current alliance, resolves it strictly and delegates to the explicit locked save.

This sits on top of F7 acknowledgement serialization, F8 assignment/profile serialization and F9 assignment/acknowledgement/deputy/tactical membership serialization.

No Castle Command production migration, Realtime policy, production data mutation or merge is authorised by this CI retarget.

Required validation on the exact resulting head:

- permanent Castle Command tests 001A–001F, including F7–F11 serialization contracts and the 20-migration governed order;
- full Vision integration validation;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- lint;
- production TypeScript/Vite build.

Validation results are to be recorded in PR #94 metadata/comment after the workflows finish rather than by another source commit, so the validated head remains exact.

After validation, PR #94 must be restored to its 001E stacked base. The superseded F8/F9 threads and the new F10/F11 threads remain review-gated until a fresh exact-head Codex pass confirms the final candidate.

Production activation remains STOPPED pending clean independent exact-head review and real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated Realtime and role acceptance.
