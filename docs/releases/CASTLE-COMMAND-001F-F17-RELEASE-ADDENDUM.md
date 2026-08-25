# CASTLE-COMMAND-001F — F17 Release Addendum

Status: **STOP — production activation remains unauthorised.**

This addendum supersedes the latest final migration-order, exact-head review and tactical-snapshot lock-order acceptance sections of the earlier 001F release records. Earlier findings and their audit history remain valid.

## Finding F17 — tactical snapshot guard inverted session/assignment lock order

Fresh exact-head Codex review of `e8183df5bc192bbacb817bb50da6ad2a0b0b0cad` identified a P1 deadlock path in the tactical-version assignment-snapshot trigger.

A null-auth service or migration could directly insert a tactical-plan version. The BEFORE INSERT snapshot guard locked the session's assignment rows before the row's `session_id` foreign-key check acquired its parent-session key-share lock. Concurrently, normal Castle assignment mutation holds the session row `FOR UPDATE` before it reaches assignment rows. The two paths could therefore form `assignment -> session` / `session -> assignment` and abort one transaction with SQLSTATE `40P01`.

The correction is:

`20260823170500_castle_command_tactical_snapshot_session_lock_order.sql`

It replaces `enforce_castle_command_tactical_assignment_snapshot()` so every tactical-version persistence path, including null-auth service/migration inserts, follows:

`session → assignments → snapshot`

The guard now:

- explicitly locks the exact `castle_command_sessions` row `FOR UPDATE` before assignment reads;
- fails closed if the session does not exist;
- locks session assignment rows in deterministic assignment-ID order;
- rebuilds the canonical assignment snapshot only after those locks;
- rejects snapshot drift with SQLSTATE `40001` as before.

This preserves the global Castle parent-first session lock discipline and removes the F17 `40P01` cycle without weakening the F13 tactical-snapshot integrity guard.

## Final migration dependency order

The corrected candidate contains **26 ordered Castle Command migrations**. The final hardening tail is:

1. `20260823162000_castle_command_ack_transition_serialization.sql`
2. `20260823162500_castle_command_assignment_profile_serialization.sql`
3. `20260823163000_castle_command_membership_transition_serialization.sql`
4. `20260823163500_castle_command_deputy_consent_serialization.sql`
5. `20260823164000_castle_command_write_authority_boundary.sql`
6. `20260823164500_castle_command_authority_record_serialization.sql`
7. `20260823165000_castle_command_ack_assignment_lock_order.sql`
8. `20260823165500_castle_command_reset_assignment_lock_order.sql`
9. `20260823170000_castle_command_assignment_snapshot_serialization.sql`
10. `20260823170500_castle_command_tactical_snapshot_session_lock_order.sql`

All earlier Castle migrations retain their existing governed order before this tail.

## Permanent regression gate

The existing Castle Command CI step must execute:

`node --import tsx scripts/test-castle-command-001f-f17.mjs`

in addition to the existing 001A–001F and F13–F16 suites. No additional workflow or job is required.

## Remaining release gates

After the corrected exact head passes CI:

1. obtain a fresh independent exact-head Codex review with no unresolved actionable findings;
2. only then resolve superseded review threads;
3. complete real authenticated role/private-Realtime acceptance for manager, deputy, assigned participant, unassigned member, former member and unauthenticated access, including concurrency/revocation/deadlock scenarios F7–F17;
4. require explicit owner advancement before any production migration, Realtime policy change or merge.

No production Castle schema, data, migration ledger or Realtime policy is changed by this addendum.
