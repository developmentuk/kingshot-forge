# CASTLE-COMMAND-001F — Final CI Candidate Procedure

This file records the deliberate CI-only `main` retarget for PR #94 after correction of fresh independent Codex findings F18/P1 and F19/P2.

Candidate parent before this evidence commit:

`e06533a134331fa0d4f64e7ec08be828935f4f35`

The resulting commit is the frozen corrected CASTLE-COMMAND-001F candidate to be validated against the canonical `main` baseline `40c581eb20fa145c20efe0634b3e07e9c273a581`.

The governed release chain now contains **27 Castle Command migrations**. The latest release-hardening migration is:

`20260823171000_castle_command_profile_privacy_write_boundary.sql`

F18/F19 close the final profile privacy and authenticated-write ambiguity:

- direct Castle profile and timing-row SELECT policies are explicitly re-established as owner/admin only;
- ordinary alliance members receive shared timing only through `list_castle_command_alliance_profiles(target_alliance_id)`, whose scoped implementation requires `profile.shared_alliance_id = target_alliance_id`;
- foundation profile INSERT/UPDATE policies are dropped and authenticated profile INSERT/UPDATE privileges are revoked;
- foundation timing INSERT/UPDATE/DELETE policies are dropped and authenticated timing mutation privileges are revoked;
- the existing client already saves through `save_castle_command_profile(...)`;
- the final save implementation continues to lock and validate current alliance membership before shared consent persists;
- owner-controlled top-level profile deletion remains available under its existing RLS policy.

The authoritative final release-order/review addendum is:

`docs/releases/CASTLE-COMMAND-001F-F18-F19-RELEASE-ADDENDUM.md`

No Castle Command production migration, Realtime policy, production data mutation or merge is authorised by this CI retarget.

Required validation on the exact resulting head:

- permanent Castle Command tests 001A–001F plus F13–F17 focused regressions;
- focused F18/F19 privacy/write-boundary regression;
- executable governed 27-migration count/order assertion;
- full Vision integration validation;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- lint;
- production TypeScript/Vite build.

Validation results are to be recorded in PR #94 metadata/comment after the workflows finish rather than by another source commit, so the validated head remains exact.

After validation, PR #94 must be restored to its 001E stacked base. F8–F19 review threads remain review-gated until a fresh exact-head Codex pass confirms the corrected candidate.

Production activation remains **STOPPED** pending clean independent exact-head review and real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated Realtime and role acceptance.
