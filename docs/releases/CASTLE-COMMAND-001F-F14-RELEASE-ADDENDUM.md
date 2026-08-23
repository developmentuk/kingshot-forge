# CASTLE-COMMAND-001F — F14 Release Addendum

Status: **STOPPED pending fresh exact-head validation, independent review and authenticated acceptance**.

This addendum is part of the governed CASTLE-COMMAND-001F release record. It supersedes the final migration dependency order, permanent regression gate, review gate and affected concurrency-acceptance requirements in the earlier 001F/F13 release records. All earlier findings, architecture, privacy decisions, production-containment rules and unaffected acceptance requirements remain in force.

## Finding F14 — participant acknowledgement locking inverted the assignment cascade order

Fresh independent Codex review of exact head `714f1490a4c8c7220cf86ef8396cd7ca94209107` found a P1 deadlock in the participant READY/SENT path.

F13 correctly made participant authority depend on the concrete assignment row, but the inherited `set_castle_command_acknowledgement(...)` RPC had already locked the acknowledgement row before the F13 write-boundary trigger attempted to lock the assignment. A concurrent null-auth assignment deletion naturally locks the assignment first and then cascades to the acknowledgement. The two transactions could therefore form opposite orders:

- participant: `acknowledgement -> assignment`;
- cascade deletion: `assignment -> acknowledgement`.

That cycle can raise SQLSTATE `40P01` and abort one transaction.

Correction: `20260823165000_castle_command_ack_assignment_lock_order.sql`.

Final participant acknowledgement order is:

`session -> current membership + concrete assignment authority -> acknowledgement state`

The replacement READY/SENT RPC calls the F13 `lock_castle_command_participant_authority(...)` helper before reading or locking the acknowledgement row. That helper locks the qualifying current membership and concrete assignment row. A concurrent null-auth assignment delete/cascade therefore linearizes safely:

- if deletion wins first, participant authority revalidation fails before acknowledgement locking;
- if READY/SENT locks assignment first, deletion waits until the already-authorised acknowledgement transaction commits.

The F13 acknowledgement write trigger may re-check the same participant helper later in the transaction; re-locking rows already owned by the same transaction does not invert the order.

## Final migration dependency order

The corrected release candidate contains **23 Castle Command migrations**. They must be applied in this exact filename order and must not be selectively skipped:

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

Exact head `714f1490a4c8c7220cf86ef8396cd7ca94209107` and its green CI are superseded for release purposes because they do not contain F14.

## Permanent regression gate

`scripts/test-castle-command-001f-f14.mjs` runs in the existing `Test Castle Command` step after the A–F, F13 regression suites. It guards:

- session lock before participant authority;
- participant assignment authority before acknowledgement-row access;
- F13 concrete assignment locking as a prerequisite;
- F13 -> F14 migration ordering;
- this 23-migration release contract.

No new workflow or job is added.

## Review gate

**STOP. Do not apply Castle Command migrations to production yet.**

The corrected F14 exact head must:

1. pass the complete existing Forge validation suite, including F13 and F14 regressions;
2. receive a fresh independent Codex review with no unresolved actionable finding;
3. preserve production containment;
4. complete real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated + private-Realtime acceptance;
5. receive explicit owner advancement before any production activation or merge.

## Additional authenticated acceptance case

Exercise concurrent null-auth/service assignment deletion against participant READY and SENT on an existing acknowledgement row. Acceptance requires deterministic linearization without SQLSTATE `40P01`: either the participant mutation commits before assignment deletion, or the completed deletion causes participant authority to fail before acknowledgement mutation.

No production activation is authorised by this addendum.
