# CASTLE-COMMAND-001F — F15 Release Addendum

Status: **STOPPED pending fresh exact-head validation, independent review and authenticated acceptance**.

This addendum is part of the governed CASTLE-COMMAND-001F release record. It supersedes the final migration dependency order, permanent regression gate, review gate and affected cascade/concurrency acceptance requirements in the earlier 001F/F13/F14 records. All earlier findings, architecture, privacy decisions, production-containment rules and unaffected acceptance requirements remain in force.

## Finding F15 — acknowledgement reset still crossed assignment/deputy cascades in child-first order

A targeted post-F14 cascade audit found the equivalent lock-order risk in `reset_castle_command_acknowledgement(...)` before the next CI/review cycle.

The inherited reset path locked the session and membership-sensitive deputy authority, then wrote/upserted acknowledgement state. Under F13/F14 the final acknowledgement trigger could then need the concrete deputy grant. A null-auth assignment deletion can hold the assignment and cascade to both the deputy grant and acknowledgement. Without owning the target assignment first, reset could still cross those child rows in the opposite order in the self-target/deputy case.

Correction: `20260823165500_castle_command_reset_assignment_lock_order.sql`.

Final reset order is:

`session -> target assignment -> locked event-manager/deputy authority -> acknowledgement state`

The replacement reset RPC:

- locks the session and rejects closed history;
- locks the exact target assignment before any child authority/acknowledgement write;
- then requires locked Forge event-manager authority or the F13 membership+concrete-deputy-grant authority;
- only then inserts/updates `waiting` acknowledgement state.

This makes assignment deletion/cascade the common parent-first boundary for both participant READY/SENT (F14) and command/deputy reset (F15).

## Final migration dependency order

The corrected release candidate contains **24 Castle Command migrations**. They must be applied in this exact filename order and must not be selectively skipped:

1. `20260823120400_castle_command_session_foundation.sql`
2. `20260823121800_castle_command_atomic_profile_save.sql`
3. `20260823122200_castle_command_shared_projection_lockdown.sql`
4. `20260823132500_castle_command_live_command_room.sql`
5. `20260823133600_castle_command_live_authority_hardening.sql`
6. `20260823134100_castle_command_assignment_ack_reset.sql`
7. `20260823141000_castle_command_battle_tactics_deputies.sql`
8. `20260823151500_castle_command_shared_tactical_operations.sql`
9. `20260823152000_castle_command_tactical_context_snapshot.sql`
10. `20260823154500_castle_command_current_membership_authority_hardening.sql`
11. `20260823155000_castle_command_release_privacy_integrity_hardening.sql`
12. `20260823155500_castle_command_alliance_scoped_sharing.sql`
13. `20260823160000_castle_command_scoped_sharing_compatibility.sql`
14. `20260823160500_castle_command_assignment_scope_hardening.sql`
15. `20260823161000_castle_command_tactical_json_compatibility.sql`
16. `20260823161500_castle_command_closed_session_ack_hardening.sql`
17. `20260823162000_castle_command_ack_transition_serialization.sql`
18. `20260823162500_castle_command_assignment_profile_serialization.sql`
19. `20260823163000_castle_command_membership_transition_serialization.sql`
20. `20260823163500_castle_command_deputy_consent_serialization.sql`
21. `20260823164000_castle_command_write_authority_boundary.sql`
22. `20260823164500_castle_command_authority_record_serialization.sql`
23. `20260823165000_castle_command_ack_assignment_lock_order.sql`
24. `20260823165500_castle_command_reset_assignment_lock_order.sql`

Exact head `714f1490a4c8c7220cf86ef8396cd7ca94209107` and its green CI are superseded for release purposes by F14/F15.

## Permanent regression gate

`scripts/test-castle-command-001f-f15.mjs` runs in the existing `Test Castle Command` step after A–F, F13 and F14 regressions. It guards:

- target assignment locking before reset authority;
- manager/deputy authority after assignment locking;
- acknowledgement persistence after both assignment and authority locks;
- F13 concrete deputy-grant locking as a prerequisite;
- F14 -> F15 migration ordering;
- this 24-migration release contract.

No new workflow or job is added.

## Review gate

**STOP. Do not apply Castle Command migrations to production yet.**

The corrected F15 exact head must:

1. pass the complete Forge validation suite including F13, F14 and F15 regressions;
2. receive a fresh independent Codex review with no unresolved actionable finding;
3. preserve production containment;
4. complete real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated + private-Realtime acceptance;
5. receive explicit owner advancement before any production activation or merge.

## Additional authenticated acceptance cases

In addition to all earlier 001F cases:

1. race null-auth/service deletion of a target assignment against manager reset of that target acknowledgement; the reset must linearize before deletion or fail after deletion, without deadlock;
2. repeat with the reset caller acting only as a deputy;
3. repeat where the deputy resets their own acknowledgement, so the assignment delete cascades both the deputy grant and acknowledgement; no `40P01` is acceptable and no reset may commit after completed assignment deletion.

No production activation is authorised by this addendum.
