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

Those results remain evidence for the inherited A–E implementation, but they do **not** validate the later 001F corrections. The corrected 001F exact head requires a fresh A–F run before release.

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

The final integration candidate contains **16 Castle Command migrations**. They must be applied in this exact filename order and must not be selectively skipped:

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

The earlier migrations describe the incremental implementation history. The 001F migrations are required release corrections and define the final active authority/privacy behaviour. Production must never be accepted in a partially-applied state.

## Permanent regression gate

`scripts/test-castle-command-001f.mjs` is part of the existing Castle Command step in `vision-integration-check.yml`.

It guards, at minimum:

- current-membership enforcement for participant/deputy authority;
- current-membership enforcement for READY/SENT and deputy appointment;
- minimal direct authenticated column grants;
- server-owned new-session lifecycle/identity;
- removal of raw Castle profile ID from shared alliance projection;
- alliance-scoped sharing consent;
- server-side single-current-alliance compatibility resolution;
- no unsupported `min(uuid)` sharing implementation;
- assignment RPC enforcement of the exact sharing scope;
- closed assignment immutability;
- final tactical JSON validation using supported Postgres functions;
- current-membership check before tactical publication;
- closed acknowledgement immutability;
- client-side suppression of stale alliance sharing after transfer;
- documented final migration order and explicit production STOP gate;
- permanent CI inclusion of the 001F regression suite itself.

## Review gate — STILL BLOCKING

Forge governance requires Review before Merge.

At the original 001F preflight, PRs #89–#93 had zero submitted reviews and zero review threads/comments. The 001F release review subsequently found the actionable defects above, so the original preflight was correctly not promoted to activation.

The corrected exact 001F head must now:

1. pass the full A–F validation suite;
2. receive a fresh independent exact-head review with no unresolved actionable findings;
3. preserve production containment until the activation step is explicitly authorised.

## Realtime activation gate

001C and later use one private topic per session:

`castle-command:<session-uuid>`

Realtime is notification/Presence transport only. Database state remains canonical.

Before acceptance, verify with real authenticated clients that:

1. a **current-alliance assigned** participant can receive the private channel;
2. an authorised alliance event manager can receive it;
3. a **current-alliance assigned** deputy can receive it after appointment;
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

Verify:

- login is required;
- linked Player Passport identity is used;
- own five target timings save atomically;
- Howler timing remains observed-only;
- sharing is off by default;
- explicit sharing binds to the exact current alliance;
- after a simulated alliance transfer, the old consent does not expose timings to the new alliance and the UI presents sharing as off;
- re-sharing in the new current alliance requires an explicit new save;
- direct access to another player's raw Castle profile/user/audit identifiers fails.

### Ordinary current alliance member

Verify:

- may see only intentionally shared Castle timing through the limited projection;
- cannot create/manage sessions without event-management authority;
- cannot appoint deputies;
- cannot mutate another player's profile;
- cannot enter a private Live Room unless assigned.

### Assigned participant

Verify:

- can enter the private Live Room while still a current alliance member;
- loses Live Room/private Realtime access after current membership is removed;
- can mark own assignment READY;
- SENT requires prior READY and active session;
- cannot reset other players;
- receives shared tactical plan updates;
- shared tactical plan is read-only;
- assignment changes invalidate prior acknowledgement.

### Event manager

Verify:

- new sessions are always server-created in planning state with server-owned ID/timestamps;
- can assign only current members whose timing profile is explicitly scoped to the session alliance;
- assignment timing is server-derived from saved observed profile;
- can start/close session and reset acknowledgements only before close;
- can appoint/remove only current-alliance assigned deputies;
- can publish shared tactical versions only when all assignments remain current alliance members;
- concurrent-version conflict is preserved rather than overwritten.

### Deputy

Verify:

- gains live session command authority only while assigned and still a current alliance member;
- can operate permitted live/tactical controls;
- cannot appoint other deputies;
- does not gain alliance administration or 001B roster-edit authority;
- loses command/Realtime authority after alliance membership removal.

### Unassigned / former / unauthenticated

Verify:

- cannot enter the private Live Room;
- cannot subscribe to a guessed private Castle topic;
- cannot call mutation RPCs successfully;
- cannot read raw private Castle tables/audit columns;
- a former member with historical assignment/deputy records is denied.

## End-to-end simulated battle acceptance

After schema activation and role acceptance:

1. owner saves five observed timings and an observed Howler profile;
2. owner explicitly shares timing with current alliance;
3. event manager creates a future Castle session;
4. manager assigns multiple players across Castle and turret targets;
5. participants independently enter Live Room;
6. manager appoints one assigned deputy;
7. participants mark READY;
8. manager publishes tactical plan v1;
9. deputy publishes v2 with a controlled change;
10. stale v1 client attempts save and receives conflict instead of overwrite;
11. manager changes a material assignment and prior READY is invalidated;
12. session starts;
13. countdown is checked immediately before and at exact launch time;
14. SENT cannot occur before READY or before active session;
15. simultaneous / staggered / multi-wave plans are exercised;
16. counter mode requires an explicit operator-observed anchor;
17. Realtime loss produces stale-sync warning and pauses trusted audio cues;
18. session closes and cannot be reopened;
19. assignment removal and acknowledgement reset fail after close;
20. old tactical history remains immutable;
21. battle summary reports only Forge-owned coordination facts and makes no combat-result claim.

No actual Kingshot rally or combat action is required for this acceptance; it is a Forge coordination simulation.

## Cost-controlled release strategy

Do not merge the stacked implementation PRs independently merely to move the stack to `main` if that causes redundant production builds.

Preferred final release shape after review/acceptance:

- retain PRs #89–#93 as the auditable implementation chain;
- use PR #94 / the 001F integration branch as the single final `main` release candidate containing the exact A–E stack plus release hardening and acceptance documentation;
- run the final corrected exact-head validation once;
- merge only the owner-approved integration candidate;
- record the final disposition of #89–#93 explicitly;
- avoid unnecessary production deployments.

## Isolated Supabase branch option

A Supabase development branch remains the preferred place to execute the complete migration chain before production because it can validate DDL and authenticated behaviour without modifying production.

Supabase requires organisation-specific cost lookup and explicit cost confirmation before branch creation. No paid Supabase branch has been created and no branch cost has been incurred.

## Current decision

**STOP. Do not apply Castle Command migrations to production yet.**

The release review found and corrected actionable authorization, privacy, consent, immutability and Postgres-compatibility defects. Those corrections are now protected by the 001F regression suite. The branch is frozen for final corrected exact-head CI; after CI, fresh independent review and real authenticated role/Realtime acceptance remain mandatory before production activation.
