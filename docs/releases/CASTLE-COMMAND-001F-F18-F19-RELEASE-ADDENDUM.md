# CASTLE-COMMAND-001F — F18/F19 Release Addendum

Status: **review-gated / production activation stopped**

This addendum records the final profile privacy and authenticated-write boundary corrections following fresh independent review of exact head `fa2f2afcf0113c699233e14b47d2add43e3599e5`.

## Findings

### F18 / P1 — raw profile reads were not proven to respect exact sharing scope

The release must not depend on an ordinary alliance member being able to read `castle_command_profiles` or `castle_command_profile_targets` directly. The only supported alliance-sharing surface is the narrow `list_castle_command_alliance_profiles(target_alliance_id)` projection, which already requires the owner to be current in the requested alliance and requires `profile.shared_alliance_id = target_alliance_id`.

Final policy: **owner/admin-only direct reads**. Ordinary alliance members receive shared Castle timing only through the exact-alliance projection RPC.

### F19 / P2 — raw authenticated profile writes could bypass consent serialization if table write privileges/policies survived the migration chain

The governed `save_castle_command_profile(...)` implementation already locks and validates current alliance membership before shared consent is persisted. Release activation must make that RPC the only authenticated INSERT/UPDATE path for profile and timing data.

Final policy: **RPC-only authenticated writes** for profile INSERT/UPDATE and all timing-row mutation. Existing owner-controlled top-level profile deletion is preserved.

## Final hardening migration

`20260823171000_castle_command_profile_privacy_write_boundary.sql`

The migration:

- drops both legacy and intermediate direct profile SELECT policies and recreates owner/admin-only profile SELECT RLS;
- drops both legacy and intermediate timing SELECT policies and recreates owner/admin-only target SELECT RLS;
- never uses the historical `users_share_current_alliance(...)` relationship predicate for raw reads;
- drops foundation profile INSERT/UPDATE policies;
- drops foundation target INSERT/UPDATE/DELETE policies;
- revokes authenticated profile INSERT/UPDATE privileges;
- revokes authenticated target INSERT/UPDATE/DELETE privileges;
- keeps direct owner profile loading available under RLS;
- keeps owner-controlled top-level profile deletion available;
- leaves alliance sharing exclusively on the exact-alliance projection RPC;
- leaves profile/timing persistence exclusively on the locked SECURITY DEFINER save RPC for authenticated clients.

## Final release chain

The corrected integration candidate contains **27 ordered Castle Command migrations**. The latest migration is:

`20260823171000_castle_command_profile_privacy_write_boundary.sql`

## Acceptance required before activation

The candidate must pass:

- Castle Command 001A–001F permanent regressions;
- F13–F17 concurrency/lock-order regressions;
- focused F18/F19 direct-read/privacy and raw-write-boundary regression;
- governed 27-migration order checks;
- complete Vision integration validation;
- lint;
- production TypeScript/Vite build;
- Buildings Companion validation;
- Companion Index validation;
- Island Route validation;
- fresh independent exact-head review with no actionable findings;
- real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated role and private-Realtime acceptance before any production activation.

No Castle Command migration, Realtime policy, production data mutation, merge, or paid Supabase branch is authorised by this addendum.
