# CASTLE-COMMAND-001F — Activation & Battle Acceptance

Status: **STOPPED pending corrected exact-head validation, independent review and authenticated acceptance**.

This milestone is the controlled integration, release-hardening, activation, role-security and battle-acceptance gate for CASTLE-COMMAND-001A through 001E. It does not add a new gameplay mode; it corrects release-boundary defects discovered by the full-stack review and defines the activation evidence required before production release.

## Exact implementation chain

Canonical production/main baseline at 2026-08-23 preflight:

- `main`: `40c581eb20fa145c20efe0634b3e07e9c273a581`

Validated implementation stack before 001F review corrections:

- 001A / PR #89: `5d8ed123d5f18dadee0deb48a994652830b785b9`
- 001B / PR #90: `375963f54e0c3f97d9bc3dc8803164bcbaaebb47`
- 001C / PR #91: `476a1d11f2fd27a4606ad49c4f34e18f165df1fa`
- 001D / PR #92: `3610c375ba846e2c772156809cb3c4e40e202230`
- 001E / PR #93: `f10b8ff2e59dab514d875a05e90317b3aae29caa`
- 001F branch baseline: exact 001E head above

PRs #89–#93 remain open, draft and unmerged. PR #94 is the integration/release-hardening gate stacked on the exact 001E head outside temporary CI retargeting.

## Validation completed before the 001F corrections

The exact 001E head passed:

- Vision integration gate
- permanent Castle Command test gate covering 001A + 001B + 001C + 001D + 001E
- Buildings Companion validation
- Companion Index validation
- Island Route validation
- lint
- production TypeScript/Vite build

Those results remain evidence for the inherited A–E implementation, but they do **not** validate later 001F corrections. Every new 001F correction requires a fresh exact-head A–F run before release.

## Fresh full-stack review findings

The 001F release review intentionally re-read the complete Castle Command diff and migration authority chain rather than relying only on the earlier green build.

### Finding F1 — stale membership retained Live Room / deputy authority

The inherited 001D session authority functions used historical assignment/deputy records plus Player Account ownership but did not require the user to remain a current member of the session alliance.

Impact before correction:

- a player who left the alliance could remain a Live Room participant;
- a former-member deputy could retain session command authority;
- the same authority flowed into private Realtime authorization;
- the same authority flowed into 001E shared tactical plan/history/summary access;
- the participant acknowledgement RPC did not independently re-check current membership.

Correction: `20260823154500_castle_command_current_membership_authority_hardening.sql`.

The final authority model requires current alliance membership for participant/deputy authority. Existing Forge event-management authority remains server-owned. READY/SENT and deputy appointment are also re-checked at mutation time.

### Finding F2 — raw audit columns and unnecessary profile identifier exposure

The inherited schema granted broad row SELECT on session, assignment and acknowledgement tables. RLS restricted which rows were visible, but an authorised row reader could request internal audit columns not needed by Castle Command clients. The alliance profile projection also exposed the internal Castle profile UUID even though the UI did not require it.

Correction: `20260823155000_castle_command_release_privacy_integrity_hardening.sql` plus the 001F cloud-service adjustment.

Final direct authenticated reads are column-limited:

- session `created_by` is not directly readable;
- assignment `profile_id` and `added_by` are not directly readable;
- acknowledgement `last_changed_by` is not directly readable;
- alliance timing projection does not return the internal Castle `profile_id` or Forge `user_id`.

`player_account_id` remains in operational projections because assignment, acknowledgement and deputy operations require a stable Player Account selector. It is treated as an opaque operational identifier, not as sharing of the underlying Castle profile/user row.

The same migration also makes new session identity/lifecycle server-owned: new sessions are forced to `planning`, `closed_at` must be null, creator must match `auth.uid()`, ID/timestamps are generated server-side and title whitespace is normalised.

### Finding F3 — sharing consent could silently follow an alliance transfer

The inherited 001B model represented consent only as `share_with_alliance boolean`. A profile shared while the owner belonged to Alliance A could later become visible to Alliance B after the owner transferred, because the boolean remained true and the projection followed current membership.

Correction: `20260823155500_castle_command_alliance_scoped_sharing.sql` and `20260823160000_castle_command_scoped_sharing_compatibility.sql`.

Final sharing consent is bound to `shared_alliance_id`. The compatibility RPC resolves the caller's single current alliance server-side when sharing is enabled. If the player transfers, the old scope is not visible in the new alliance and the UI presents sharing as off until the player explicitly opts in again.

### Finding F4 — assignment RPC could bypass the new sharing scope; closed roster remained mutable

After adding alliance-scoped consent, the inherited assignment mutation still tested the old boolean/current-membership combination and did not verify `shared_alliance_id`. A caller who already knew a Player Account ID could therefore bypass the new projection boundary. The inherited remove-assignment RPC also allowed deletion after session close.

Correction: `20260823160500_castle_command_assignment_scope_hardening.sql`.

The final assignment mutation requires the profile's exact sharing scope to equal the session alliance, verifies Player Account ownership against the profile owner and rejects null Howler choice. Closed-session assignment history is immutable.

### Finding F5 — production Postgres does not provide `jsonb_object_length(jsonb)`

A live read-only compatibility query confirmed that the connected production Postgres returns SQLSTATE `42883` for `jsonb_object_length(jsonb)`. The inherited 001E tactical-save definitions referenced that function, so the first tactical save would fail at runtime even though the application TypeScript/build was green.

No DDL or production data change occurred during this check.

Correction: `20260823161000_castle_command_tactical_json_compatibility.sql`.

The final tactical-save RPC validates exact wave-key count with supported `jsonb_object_keys()`. It also refuses to publish a new tactical version while the session contains an assigned player who is no longer a current alliance member.

### Finding F6 — closed acknowledgement history remained resettable

The inherited deputy/manager acknowledgement reset RPC did not reject a closed session. A closed session could not be reopened, but READY/SENT history could still be rewritten.

Correction: `20260823161500_castle_command_closed_session_ack_hardening.sql`.

Closed Castle Command acknowledgement state is now immutable.

### Finding F7 — participant acknowledgement transitions were not serialized with session closure

The fresh independent Codex review of exact head `71c4008a2da405ff9341ed834ddb18cabe4984f6` found a P1 concurrency defect in `set_castle_command_acknowledgement(...)`. READY/SENT read the session without locking it. A participant transition could validate while the session was open, then a concurrent close could commit before the acknowledgement write. Concurrent READY/SENT calls could also validate against stale acknowledgement state and move a committed SENT state backwards.

Correction: `20260823162000_castle_command_ack_transition_serialization.sql`.

The final participant acknowledgement RPC acquires the session row `FOR UPDATE` before lifecycle/authority validation and locks the existing acknowledgement row before transition validation. Session close, manager reset and participant READY/SENT now share the session-row serialization boundary. A close cannot commit between participant validation and durable acknowledgement mutation, and concurrent acknowledgement transitions cannot validate against the same stale state.

### Finding F8 — assignment snapshots were not serialized with profile sharing/timing saves

The fresh independent Codex re-review of exact head `68274954e576b4a5fecb4938709d303995cd3f66` found a P1 concurrency defect in `set_castle_command_session_assignment(...)`. The assignment RPC validated sharing and read profile/timing state without locking the shared profile. A concurrent owner save could therefore disable sharing or change timings, commit, and still be followed by an assignment built from the stale pre-save consent/timing snapshot.

Correction: `20260823162500_castle_command_assignment_profile_serialization.sql`.

The assignment RPC preserves the existing session-row lock and then locks the qualifying shared profile row `FOR UPDATE` before reading target timings. Profile saves already upsert the profile row before changing the five target timing rows and hold that row lock until transaction end. This creates one serialization boundary for sharing consent, profile metadata and timing snapshots: assignment either completes before the owner save or waits and re-validates the committed post-save state.

### Finding F9 — durable membership-sensitive writes were not serialized with membership transitions

The fresh independent Codex review of exact head `fd6e81e6e91a513571e4f3ab74f74c981c2bd73e` found a P1 concurrency defect in assignment eligibility. The assignment RPC joined the target player's `current` alliance membership but did not lock that membership row. A concurrent membership-status change could therefore commit after eligibility was read but before the assignment was persisted, producing a new assignment snapshot after the player had already left the alliance.

A follow-up concurrency sweep found the same transaction-boundary pattern in participant READY/SENT, deputy appointment and tactical publication: each durable write depended on current membership but could validate an unlocked membership row before a concurrent removal committed.

Correction: `20260823163000_castle_command_membership_transition_serialization.sql`.

The final mutation layer uses one consistent lock discipline:

- assignment locks `session → target membership → shared profile`, then reads timings and writes the snapshot;
- READY/SENT locks `session → caller membership → acknowledgement state`;
- deputy appointment locks `session → target membership` before creating the deputy grant;
- tactical publication locks `session`, then all assigned current-membership rows in deterministic `user_id` order before re-checking eligibility and building the assignment snapshot.

These membership locks force a concurrent status update/delete to linearize on one side of the Castle mutation: if membership removal commits first, the Castle mutation re-validates and fails; if Castle acquires the membership row first, the removal waits until the already-authorised mutation commits. The final assignment lock order is `session → membership → profile`; profile saves do not lock sessions or memberships, and the Castle session lock serializes same-session mutation paths, avoiding a reverse Castle lock path.

## Production containment — CONFIRMED

Read-only Supabase checks during 001F confirm Castle Command remains unactivated:

- `castle_command_profiles`: absent
- `castle_command_profile_targets`: absent
- `castle_command_sessions`: absent
- `castle_command_session_assignments`: absent
- `castle_command_session_acknowledgements`: absent
- `castle_command_session_deputies`: absent
- `castle_command_tactical_plans`: absent
- `castle_command_tactical_plan_versions`: absent
- Castle Command policies on `realtime.messages`: zero
- Castle Command migrations in the production migration ledger: zero

No Castle Command production schema, data or Realtime policy has been installed.

## Live dependency preflight — PASSED

The connected Supabase project contains the existing authority objects required by the migrations:

- `public.alliance_memberships`
- `public.alliance_admins`
- `public.player_accounts`
- `public.alliances`
- `public.alliance_membership_status`
- `public.current_user_role()`
- `public.set_updated_at()`
- `realtime.messages`
- `realtime.send(jsonb,text,text,boolean)`

Required alliance/player columns exist with the expected broad types. Production currently has a viable manager/member/player-account shape for later authenticated acceptance without recording personal identifiers in this document.

## Final migration dependency order

The final integration candidate contains **19 Castle Command migrations**. They must be applied in this exact filename order and must not be selectively skipped:

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

The earlier migrations describe the incremental implementation history. The 001F migrations are required release corrections and define the final active authority/privacy/concurrency behaviour. Production must never be accepted in a partially-applied state.

## Permanent regression gate

`scripts/test-castle-command-001f.mjs` is part of the existing Castle Command step in `vision-integration-check.yml`.

It guards current-membership authority, column minimisation, server-owned session creation, exact alliance-scoped sharing consent, assignment scope, closed-session immutability, production-compatible tactical JSON validation, acknowledgement-transition serialization, assignment/profile-save serialization, membership-transition serialization for assignment/acknowledgement/deputy/tactical writes, client projection boundaries, documented migration order, explicit production STOP state and permanent CI inclusion.

## Review gate — STILL BLOCKING

Forge governance requires Review before Merge.

At the original 001F preflight, PRs #89–#93 had zero submitted reviews and zero review threads/comments. The 001F full-stack release review found F1–F6. After those corrections, exact head `71c4008a2da405ff9341ed834ddb18cabe4984f6` passed the full A–F CI suite, but its fresh independent Codex review returned F7/P1. After F7, exact head `68274954e576b4a5fecb4938709d303995cd3f66` passed the full A–F CI suite, but its fresh independent Codex re-review returned F8/P1. After F8, exact head `fd6e81e6e91a513571e4f3ab74f74c981c2bd73e` passed the full A–F CI suite, but its fresh independent Codex review returned F9/P1. All three heads are therefore superseded for release purposes.

The corrected exact 001F head must now:

1. pass the full A–F validation suite;
2. receive a fresh independent exact-head review with no unresolved actionable findings;
3. preserve production containment until the activation step is explicitly authorised.

## Realtime activation gate

001C and later use one private topic per session:

`castle-command:<session-uuid>`

Realtime is notification/Presence transport only. Database state remains canonical.

Before acceptance, verify with real authenticated clients that:

1. a current-alliance assigned participant can receive the private channel;
2. an authorised alliance event manager can receive it;
3. a current-alliance assigned deputy can receive it after appointment;
4. a former alliance member with a historical assignment/deputy row cannot receive it;
5. an unassigned ordinary user cannot receive it merely by guessing the topic;
6. an unauthenticated client cannot receive it;
7. client-authored Broadcast command/state payloads are not permitted;
8. Presence remains advisory and cannot establish player identity or command authority;
9. a metadata Broadcast causes canonical state re-fetch rather than trusting Broadcast payload state.

The relevant Supabase Realtime project/dashboard setting for private-channel enforcement must be inspected before acceptance. It has not been changed by 001A–001F.

## Role acceptance matrix

Use real authenticated test identities. Do not simulate acceptance solely with service-role SQL.

### Player / profile owner

Verify login, linked Player Passport identity, atomic five-target saves, observed-only Howler timing, sharing off by default, exact-current-alliance consent, transfer/re-consent behaviour and denial of another player's raw private/audit identifiers.

### Ordinary current alliance member

Verify only intentionally shared timing is visible through the projection, no session management/deputy powers exist and private Live Room entry is denied unless assigned.

### Assigned participant

Verify Live Room works only while current membership remains, READY/SENT transitions are constrained and serialize with both lifecycle and membership changes, shared tactical plan is read-only and assignment changes invalidate prior acknowledgement.

### Event manager

Verify server-owned planning-state session creation, scoped eligible assignment, observed server-derived timing, assignment snapshots serialize with profile consent/timing saves and target membership changes, lifecycle/ack controls only while open, deputy appointment serializes with target membership, tactical publication serializes with all assigned memberships, and optimistic version conflict handling remains intact.

### Deputy

Verify live/tactical authority only while assigned and current, no deputy appointment/alliance-admin/roster-edit powers, and immediate denial after membership removal on the next canonical authorization check.

### Unassigned / former / unauthenticated

Verify Live Room/private topic/mutation/raw-private-table access fails, including for a former member with historical assignment/deputy records.

## End-to-end simulated battle acceptance

After schema activation and role acceptance:

1. owner saves five observed timings and an observed Howler profile;
2. owner explicitly shares timing with current alliance;
3. event manager creates a future Castle session;
4. manager assigns multiple players across Castle and turret targets;
5. concurrent owner timing edit/share opt-out and manager assignment are exercised; the assignment must either serialize before the owner save or re-validate the committed post-save state and must never persist stale consent/timing snapshots after the save;
6. concurrent target-membership removal and manager assignment are exercised; the assignment must either commit before the removal or fail after re-validating the committed non-current membership state;
7. participants independently enter Live Room;
8. manager appoints one assigned deputy, including a concurrent target-membership removal check;
9. participants mark READY, including a concurrent participant-membership removal check;
10. manager publishes tactical plan v1 while assigned-membership transition checks are exercised;
11. deputy publishes v2 with a controlled change;
12. stale v1 client attempts save and receives conflict instead of overwrite;
13. manager changes a material assignment and prior READY is invalidated;
14. session starts;
15. countdown is checked immediately before and at exact launch time;
16. SENT cannot occur before READY or before active session;
17. simultaneous / staggered / multi-wave plans are exercised;
18. counter mode requires an explicit operator-observed anchor;
19. concurrent participant READY/SENT and manager close are exercised and serialize without post-close mutation or backward acknowledgement transition;
20. Realtime loss produces stale-sync warning and pauses trusted audio cues;
21. session closes and cannot be reopened;
22. assignment removal, participant acknowledgement mutation and acknowledgement reset fail after close;
23. old tactical history remains immutable;
24. battle summary reports only Forge-owned coordination facts and makes no combat-result claim.

No actual Kingshot rally or combat action is required for this acceptance; it is a Forge coordination simulation.

## Cost-controlled release strategy

Retain PRs #89–#93 as the auditable implementation chain and use PR #94 / 001F as the single final `main` release candidate after acceptance. Run corrected exact-head validation once, merge only the owner-approved integration candidate, record the final disposition of #89–#93 and avoid unnecessary production deployments.

## Isolated Supabase branch option

A Supabase development branch remains the preferred place to execute the complete migration chain before production because it can validate DDL and authenticated behaviour without modifying production. Supabase requires organisation-specific cost lookup and explicit cost confirmation before branch creation. No paid Supabase branch has been created and no branch cost has been incurred.

## Current decision

**STOP. Do not apply Castle Command migrations to production yet.**

The release review found and corrected actionable authorization, privacy, consent, immutability, Postgres-compatibility and concurrency defects. Those corrections are protected by the 001F regression suite. The corrected candidate must pass fresh A–F CI and fresh independent exact-head review; real authenticated role/Realtime acceptance remains mandatory before production activation.