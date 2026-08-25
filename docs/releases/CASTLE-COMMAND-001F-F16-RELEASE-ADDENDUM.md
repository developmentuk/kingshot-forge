# CASTLE-COMMAND-001F — F16 Release Addendum

Status: **STOP — production activation remains unauthorised.**

This addendum supersedes the latest final migration-order, exact-head review and assignment-snapshot acceptance sections of the earlier 001F release records. Earlier findings and their audit history remain valid.

## Finding F16 — assignment source timing was not fully serialized

Fresh exact-head Codex review of `2ade0451ab2bc2c1622ab9a8c79337951e358178` identified a P1 concurrency gap in `set_castle_command_session_assignment(...)`.

The assignment path already locked the Castle session, target alliance membership and shared Castle profile. It then read the selected `castle_command_profile_targets` row without locking it. A null-auth service or migration write could therefore update that timing row concurrently, allowing the assignment transaction to persist stale `march_seconds` after the newer timing had committed. The existing `profile_updated_at_snapshot` also represented only the parent profile timestamp, not a direct child timing update.

The correction is:

`20260823170000_castle_command_assignment_snapshot_serialization.sql`

It replaces the assignment RPC with a complete mutable-source serialization order:

`session → membership → account → profile → timing`

The RPC now:

- locks the target player's current `alliance_memberships` row;
- locks the exact `player_accounts` row before profile locking, preserving parent-to-child cascade order for account/profile operations;
- locks the explicitly shared `castle_command_profiles` row;
- locks the exact selected `castle_command_profile_targets` row before deriving `march_seconds`;
- derives the persisted snapshot timestamp as `greatest(command_profile.updated_at, timing.updated_at)` so direct timing-row updates are represented;
- persists the assignment only after all source rows contributing durable identity, sharing/Howler and timing values have been locked and re-read.

This also closes the adjacent direct-service identity snapshot race proactively: `player_id_snapshot` and `player_name_snapshot` now come from the locked player-account row.

## Final migration dependency order

The corrected candidate contains **25 ordered Castle Command migrations**. The final hardening tail is:

1. `20260823162000_castle_command_ack_transition_serialization.sql`
2. `20260823162500_castle_command_assignment_profile_serialization.sql`
3. `20260823163000_castle_command_membership_transition_serialization.sql`
4. `20260823163500_castle_command_deputy_consent_serialization.sql`
5. `20260823164000_castle_command_write_authority_boundary.sql`
6. `20260823164500_castle_command_authority_record_serialization.sql`
7. `20260823165000_castle_command_ack_assignment_lock_order.sql`
8. `20260823165500_castle_command_reset_assignment_lock_order.sql`
9. `20260823170000_castle_command_assignment_snapshot_serialization.sql`

All earlier Castle migrations retain their existing governed order before this tail.

## Permanent regression gate

The existing Castle Command CI step must execute:

`node --import tsx scripts/test-castle-command-001f-f16.mjs`

in addition to the existing 001A–001F, F13, F14 and F15 suites. No extra workflow or job is required.

## Remaining release gates

After the corrected exact head passes CI:

1. obtain a fresh independent exact-head Codex review with no unresolved actionable findings;
2. only then resolve superseded review threads;
3. complete real authenticated role/private-Realtime acceptance for manager, deputy, assigned participant, unassigned member, former member and unauthenticated access, including concurrency/revocation/deadlock scenarios F7–F16;
4. require explicit owner advancement before any production migration, Realtime policy change or merge.

No production Castle schema, data, migration ledger or Realtime policy is changed by this addendum.
