# CASTLE-COMMAND-001F — F13 Release Addendum

Status: **STOPPED pending fresh exact-head validation, independent review and authenticated acceptance**.

This addendum is part of the governed CASTLE-COMMAND-001F release record. It supersedes only the **Final migration dependency order**, **Permanent regression gate**, **Review gate**, and affected authenticated-acceptance/concurrency requirements in `CASTLE-COMMAND-001F-ACTIVATION-ACCEPTANCE.md`. All earlier findings, architecture, privacy decisions, production-containment requirements and acceptance requirements in that document remain in force.

## Finding F13 — deputy/participant authority records were not serialized with direct service revocation

Fresh independent Codex review of exact head `f5d5fdeba7423a5a3ad61e27a44ed16896f5f96f` found a P1 concurrency defect in the F12 write-authority boundary.

F12 locked the caller's current alliance membership before accepting deputy/participant authority, but it did not also lock the concrete authority record itself. A service/migration operation with `auth.uid() IS NULL` could directly delete a deputy row, or delete an assignment and cascade to the deputy row, while the authenticated Castle mutation had already read the still-visible grant. The authenticated mutation could then commit after the revocation.

The same authority-record principle applies to participant READY/SENT: current membership alone is insufficient if the concrete assignment can be removed concurrently by a null-auth service path.

Tactical publication also needs to ensure the immutable assignment snapshot it persists still matches the concrete assignment rows at the persistence boundary.

Correction: `20260823164500_castle_command_authority_record_serialization.sql`.

Final F13 behaviour:

- deputy authority locks both the caller's qualifying current membership **and** the exact `castle_command_session_deputies` row;
- participant authority locks both the caller's qualifying current membership **and** the exact `castle_command_session_assignments` row;
- tactical-version publication locks concrete assignment rows in deterministic assignment-ID order, rebuilds the canonical assignment snapshot after those locks are acquired and raises SQLSTATE `40001` if the snapshot changed;
- null-auth child-row service/migration writes do **not** acquire the Castle session row, avoiding a `child row -> session` reverse lock against normal authenticated `session -> membership -> authority record` mutations.

The final relevant lock directions are therefore:

- assignment manager mutation: `session -> target membership -> shared profile -> assignment write`, then final locked event-manager authority;
- participant READY/SENT: `session -> caller membership -> acknowledgement state -> concrete assignment authority check`;
- deputy lifecycle/reset/tactical authority: `session -> deputy caller membership -> concrete deputy grant`;
- tactical publication: `session -> assigned memberships (deterministic user_id order) -> concrete assignments (deterministic assignment id order) -> snapshot revalidation`;
- manager authority: Forge profile role row -> exact alliance event-manager grant;
- sharing consent: owner membership -> profile -> timing rows.

## Final migration dependency order

The corrected release candidate contains **22 Castle Command migrations**. They must be applied in this exact filename order and must not be selectively skipped:

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

The previous exact head `f5d5fdeba7423a5a3ad61e27a44ed16896f5f96f` and its green CI are superseded for release purposes because they do not contain F13.

## Permanent regression gate

`scripts/test-castle-command-001f-f13.mjs` runs inside the existing `Test Castle Command` step in `.github/workflows/vision-integration-check.yml` after the A–F regression suites.

It guards:

- deputy grant row locking;
- participant assignment row locking;
- deterministic tactical assignment locking;
- tactical snapshot rebuild after assignment locks;
- retryable conflict on snapshot drift;
- F12 -> F13 migration ordering;
- this 22-migration release contract.

## Review gate

**STOP. Do not apply Castle Command migrations to production yet.**

The corrected F13 head must:

1. pass the complete existing Forge validation suite on the exact head, including the new F13 regression;
2. receive a fresh independent Codex review with no unresolved actionable finding;
3. preserve production containment;
4. complete real authenticated manager/deputy/assigned/unassigned/former-member/unauthenticated + private-Realtime acceptance;
5. receive explicit owner advancement before any production activation or merge.

## Additional authenticated acceptance cases

In addition to all cases in the base 001F acceptance document, exercise:

1. concurrent direct service/null-auth deputy deletion versus deputy lifecycle/reset/tactical mutation — the authenticated mutation must either linearize before deletion or fail after deletion; it must not commit after a completed deputy revocation;
2. concurrent direct service/null-auth assignment deletion versus participant READY/SENT — the participant mutation must either linearize before assignment removal or fail; it must not commit acknowledgement state after a completed assignment removal;
3. concurrent direct service/null-auth assignment deletion/update versus tactical publication — the publication must lock/rebuild the assignment snapshot and fail with a retryable conflict if the snapshot changed before persistence;
4. assignment-deletion cascade to deputy grant while a deputy mutation is in flight — no stale deputy-authorised write may survive the completed cascade.

No production activation is authorised by this addendum.
