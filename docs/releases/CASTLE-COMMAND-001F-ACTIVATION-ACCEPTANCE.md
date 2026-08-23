# CASTLE-COMMAND-001F — Activation & Battle Acceptance

Status: **STOPPED at pre-activation review gate**.

This milestone does not add Castle Command gameplay functionality. It is the controlled integration, activation, role-security and battle-acceptance gate for CASTLE-COMMAND-001A through 001E.

## Exact implementation chain

Canonical production/main baseline at 2026-08-23 preflight:

- `main`: `40c581eb20fa145c20efe0634b3e07e9c273a581`

Validated Castle Command stack:

- 001A / PR #89: `5d8ed123d5f18dadee0deb48a994652830b785b9`
- 001B / PR #90: `375963f54e0c3f97d9bc3dc8803164bcbaaebb47`
- 001C / PR #91: `476a1d11f2fd27a4606ad49c4f34e18f165df1fa`
- 001D / PR #92: `3610c375ba846e2c772156809cb3c4e40e202230`
- 001E / PR #93: `f10b8ff2e59dab514d875a05e90317b3aae29caa`
- 001F branch baseline: exact 001E head above

All five implementation PRs are open, draft, mergeable and unmerged at this preflight.

## Validation already completed

The exact 001E head passed the complete PR-to-main validation suite:

- Vision integration gate
- permanent Castle Command test gate covering 001A + 001B + 001C + 001D + 001E
- Buildings Companion validation
- Companion Index validation
- Island Route validation
- lint
- production TypeScript/Vite build

No application-code validation failure is outstanding.

## Review gate — BLOCKING

Forge governance requires Review before Merge.

At 001F preflight:

- PR #89: zero submitted reviews; zero review threads/comments
- PR #90: zero submitted reviews; zero review threads/comments
- PR #91: zero submitted reviews; zero review threads/comments
- PR #92: zero submitted reviews; zero review threads/comments
- PR #93: zero submitted reviews; zero review threads/comments

Therefore neither production migration activation nor merge readiness may be declared yet.

A fresh independent exact-head review is required before crossing the production activation boundary.

## Production containment — CONFIRMED

Read-only Supabase checks confirm Castle Command remains completely unactivated:

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

Required alliance/player columns also exist with the expected broad types, including membership status, event-management capability, player identity and active/revoked administration state.

The production data contains a viable acceptance shape without recording personal identifiers in this document:

- 2 current alliance memberships
- 1 active event manager with `can_manage_events`
- 5 linked player accounts
- 1 alliance suitable for manager/member role acceptance
- 2 current memberships with linked Player Accounts

## Migration dependency order

Castle Command migrations must be applied in this exact order and must not be selectively skipped:

1. `20260823120400_castle_command_session_foundation.sql`
2. `20260823121800_castle_command_atomic_profile_save.sql`
3. `20260823122200_castle_command_shared_projection_lockdown.sql`
4. `20260823132500_castle_command_live_command_room.sql`
5. `20260823133600_castle_command_live_authority_hardening.sql`
6. `20260823134100_castle_command_assignment_ack_reset.sql`
7. `20260823141000_castle_command_battle_tactics_deputies.sql`
8. `20260823151500_castle_command_shared_tactical_operations.sql`
9. `20260823152000_castle_command_tactical_context_snapshot.sql`

Important: the first 001B migration intentionally creates a broader interim shared-profile RLS policy. Migration #3 replaces that with the final privacy-limited projection model. Production must never be accepted in a partially-applied 001B state.

Likewise, the first 001C migration establishes lifecycle and Realtime foundations; migrations #5 and #6 complete the final direct-write/clock/acknowledgement hardening. Production acceptance requires the complete chain.

## Realtime activation gate

001C and later use one private topic per session:

`castle-command:<session-uuid>`

Realtime is notification/Presence transport only. Database state remains canonical.

Before acceptance, verify with real authenticated clients that:

1. an assigned participant can receive the private channel;
2. an authorised alliance event manager can receive it;
3. an appointed session deputy can receive it after appointment;
4. an unassigned ordinary user cannot receive it merely by guessing the topic;
5. an unauthenticated client cannot receive it;
6. client-authored Broadcast command/state payloads are not permitted;
7. Presence remains advisory and cannot establish player identity or command authority;
8. a metadata Broadcast causes canonical state re-fetch rather than trusting Broadcast payload state.

The relevant Supabase Realtime project/dashboard setting for private-channel enforcement must be inspected before acceptance. That setting was not changed during 001A–001F preflight.

## Role acceptance matrix

Use real authenticated test identities. Do not simulate acceptance solely with service-role SQL.

### Player / profile owner

Verify:

- login is required;
- linked Player Passport identity is used;
- own five target timings can be saved atomically;
- Howler timing remains observed-only;
- sharing is OFF by default;
- sharing ON exposes only the limited same-current-alliance projection;
- direct access to another player's raw profile/user identifiers fails.

### Ordinary current alliance member

Verify:

- may see only intentionally shared Castle timing through the projection;
- cannot create/manage sessions without event-management authority;
- cannot appoint deputies;
- cannot mutate another player's profile;
- cannot enter a private Live Room unless assigned.

### Assigned participant

Verify:

- can enter the private Live Room;
- can mark own assignment READY;
- SENT requires prior READY and active session;
- cannot reset other players;
- receives shared tactical plan updates;
- shared tactical plan is read-only;
- assignment changes invalidate prior acknowledgement.

### Event manager

Verify:

- can create an alliance session;
- can assign only eligible explicitly-shared players;
- assignment timing is server-derived from the saved observed profile;
- can start/close session and reset acknowledgements;
- can appoint/remove only assigned deputies;
- can publish shared tactical versions;
- concurrent-version conflict is preserved rather than overwritten.

### Deputy

Verify:

- gains live session command authority only;
- can operate permitted live/tactical controls;
- cannot appoint other deputies;
- does not gain alliance administration or 001B roster-edit authority.

### Unassigned / unauthenticated

Verify:

- cannot enter the private Live Room;
- cannot subscribe to a guessed private Castle topic;
- cannot call mutation RPCs successfully;
- cannot read raw private Castle tables.

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
19. old tactical history remains immutable;
20. battle summary reports only Forge-owned coordination facts and makes no combat-result claim.

No actual Kingshot rally or combat action is required for this acceptance; it is a Forge coordination simulation.

## Cost-controlled release strategy

Do not merge the five stacked implementation PRs independently merely to move the stack to `main` if that would cause redundant production builds.

Preferred final release shape after review/acceptance:

- keep PRs #89–#93 as the auditable implementation chain;
- use the 001F integration branch as the single final `main` release candidate containing the exact A–E stack plus acceptance documentation;
- run the final exact-head validation once;
- merge only the owner-approved integration candidate;
- avoid multiple unnecessary production deployments.

The final Git history/review disposition of #89–#93 must be recorded explicitly rather than silently abandoning the stacked PRs.

## Isolated Supabase branch option

A Supabase development branch would be the preferred place to execute the complete migration chain before production because it can validate DDL and role behaviour without modifying production.

Supabase requires an organisation-specific cost lookup and explicit cost confirmation before creating that branch. No organisation ID/cost approval was supplied during this preflight, so 001F did **not** create a paid Supabase branch or incur that cost.

## Current decision

**STOP. Do not apply Castle Command migrations to production yet.**

The implementation is technically validated and production dependencies are present, but the required independent review and authenticated role/Realtime acceptance boundary have not yet been satisfied.

Next authorised action: obtain a fresh exact-head review of the 001F integration candidate / A–E stack. If that review is clean, perform isolated or tightly-controlled migration activation followed immediately by the role and simulated-battle acceptance matrix above.
