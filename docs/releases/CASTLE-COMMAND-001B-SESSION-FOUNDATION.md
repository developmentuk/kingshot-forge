# CASTLE-COMMAND-001B — Persistent Profiles and Session Foundation

Status: implementation branch

Parent: `CASTLE-COMMAND-001A`

## Purpose

CASTLE-COMMAND-001B moves Castle Command from a single-device personal calculator to a governed Alliance-domain foundation. It introduces cross-device player-owned timing profiles, explicit alliance sharing, alliance-scoped battle sessions and immutable timing snapshots for coordinated launch order calculation.

001B is stacked on the accepted 001A head. It does not widen or rewrite the 001A timing formula.

## Architectural ownership

Castle Command crosses two existing Forge domains:

- **Player domain** owns a player's observed Castle/turret march timings and Howler calibration.
- **Alliance domain** owns battle sessions, commander access and shared operational use of opted-in member timing profiles.

No second alliance roster is introduced. Current membership remains authoritative in `alliance_memberships`; linked Kingshot identity remains authoritative in `player_accounts`.

## Persistent player timing profile

A signed-in player may persist one Castle Command profile for a linked `player_accounts` record.

The profile contains:

- player account identity reference;
- Howler skill level used for the observed buffed timings;
- five target rows: Castle, North, East, South and West;
- normal observed seconds;
- Howler observed seconds;
- explicit `share_with_alliance` consent;
- creation/update timestamps.

Player timing profiles are private by default.

A player can read and change only a profile belonging to their own linked player account. Alliance sharing must never make the generic Player Passport public. Castle Command exposes only the limited identity/timing projection required for current alliance coordination.

## Alliance sharing rule

A profile is visible to another player only when all of the following are true:

1. `share_with_alliance = true`;
2. the profile owner has a `current` alliance membership;
3. the viewer has a `current` membership in the same alliance;
4. the viewer is authenticated.

Forge platform `owner` / `admin` authority may inspect for support and operational governance.

Leaving or changing alliance therefore removes ordinary alliance-member visibility automatically; there is no copied Castle Command roster to clean up.

## Castle Command management authority

Creating or changing alliance battle sessions requires:

- Forge `owner` / `admin`; or
- an active `alliance_admins` grant for the target alliance with `can_manage_events = true`.

This reuses existing Alliance-domain authority rather than creating Castle Command-specific leadership roles in 001B.

## Battle sessions

A Castle Command session belongs to one canonical alliance and records:

- title;
- intended impact timestamp;
- rally preparation duration (1, 3 or 5 minutes);
- lifecycle status: `planning`, `active`, `closed`;
- creating actor;
- creation/update/close timestamps.

All current members of the owning alliance may read the session. Only Castle Command managers may create or mutate it.

## Assignments and timing snapshots

A session assignment links one selected alliance player to one Castle/turret target.

When an assignment is created, Forge snapshots:

- player identity required for the command room;
- target;
- whether Howler is requested;
- exact observed march seconds used;
- resolution source (`normal`, `howler-observed`, or `normal-fallback`);
- whether Howler calibration is still required;
- the source profile update timestamp.

The session therefore does not silently change if a player later recalibrates their personal timing profile.

The launch order is derived from the existing 001A formula:

`rally start = impact - rally preparation - snapshotted march time`

`march departure = impact - snapshotted march time`

Assignments are ordered by rally-start timestamp, then player name, for a stable commander view.

## Howler integrity

001B preserves the 001A observation-led rule.

The database must never derive an exact Howler march duration from the advertised March Speed percentage. If Howler is requested and no observed Howler duration exists, the assignment may use the player's normal observed duration only when that normal duration exists, and it must carry `needs_howler_calibration = true`.

## Realtime boundary

001B creates session/assignment tables suitable for Supabase Realtime, but does not introduce READY/SENT acknowledgements, countdown presence, audio cues or state-machine writes.

Those live interaction semantics belong to the next Castle Command milestone so they can be designed around explicit event state, idempotency and stale-client behaviour.

## Migration and release boundary

The 001B migration is review-gated and MUST NOT be applied to the connected production Supabase project merely to make a feature-branch preview work.

Before migration approval:

- the UI may continue using 001A local persistence;
- cloud/session services must fail closed with a clear activation state when the schema is absent;
- no production data is mutated.

## Acceptance

001B is merge-ready only when:

- migration contract tests pass;
- RLS and helper-function intent is statically verified;
- cross-device profile service contracts compile;
- shared-profile mapping does not rely on generic public Player Passport access;
- session assignments snapshot, rather than live-reference, observed timings;
- launch ordering is covered by focused tests;
- TypeScript build and lint pass;
- the migration remains unapplied until owner-approved release execution.

## Explicitly deferred

- READY / SENT / CANCELLED participant acknowledgement states;
- Supabase Realtime subscriptions and presence;
- multi-wave and counter-rally offsets;
- automated Discord briefing output;
- audio/spoken launch cues;
- stale-position detection;
- battle analytics/history dashboards;
- changing or replacing existing Alliance membership/admin authority.