# CASTLE-COMMAND-001C — Live Command Room

Status: implementation branch; activation gated

## Purpose

CASTLE-COMMAND-001C turns the shared Castle Command battle session from a static coordinated plan into a private live second-screen experience for assigned players and authorised alliance event managers.

It adds low-latency state notification and advisory connection presence without making Realtime the system of record. Canonical session, assignment, player identity, role and acknowledgement state remains in Supabase tables and RPC-owned mutations.

## Scope

001C provides:

- a separate Live Command Room surface under the authenticated Castle Command page;
- private Realtime channel topics per battle session;
- assigned-player / event-manager channel authorization;
- advisory Presence connection counts without trusting client-claimed player identities or roles;
- server-clock calibration rather than trusting the browser clock;
- per-player launch countdowns based on the immutable assignment timing snapshot;
- a highlighted personal rally call for the signed-in assigned player;
- durable acknowledgement states: waiting, ready and sent;
- participant-owned READY and SENT transitions;
- manager-owned acknowledgement reset;
- automatic acknowledgement invalidation when a material assignment snapshot changes;
- manager-owned session transition from planning to active to closed;
- stale-connection and stale-server-clock warnings;
- database-triggered metadata-only state-change Broadcast notifications;
- canonical RLS-protected state re-fetch after Broadcast notification;
- mobile-responsive roster and personal-call presentation.

## Realtime architecture

Forge does not use Castle Command table rows as client-authored realtime messages.

The Live Room uses one private topic per session:

`castle-command:<session UUID>`

Realtime is used for two purposes only:

1. **Presence** — each authorised client publishes only a minimal connection timestamp after joining the private channel. Forge treats Presence as advisory connection telemetry only. It does not trust Presence payloads for player identity, assignment identity, manager role, READY/SENT state or battle authority.
2. **Broadcast notification** — database triggers emit metadata-only `state_changed` notifications after canonical session, assignment or acknowledgement changes.

A client receiving `state_changed` must re-fetch canonical state. It must not treat the Broadcast payload as authoritative battle state.

CASTLE-COMMAND-001C deliberately does **not** add Castle Command tables to the `supabase_realtime` Postgres Changes publication.

## Private channel authorization

Realtime Broadcast and Presence require policies on `realtime.messages`.

A Castle Command live topic is authorised only when the authenticated user is either:

- an assigned participant in that exact session, derived through `castle_command_session_assignments` and the user's linked `player_accounts`; or
- an authorised Castle Command manager through the existing alliance `can_manage_events` authority.

Authenticated clients receive SELECT permission through Realtime Authorization only for `broadcast` and `presence` extensions on authorised Castle Command topics.

Client INSERT authorization is limited to the `presence` extension. Clients are not permitted to publish Castle Command Broadcast commands.

Database-triggered Broadcasts are private and contain only:

- entity/table identifier;
- operation type;
- session ID;
- change timestamp.

They do not contain timing rows, acknowledgement details, user IDs or command payloads.

## Production Realtime setting gate

Before 001C can be activated, the owner must verify in the Supabase Realtime settings that:

- Realtime service is enabled;
- public channel access is disabled / private channels are enforced;
- the `realtime.messages` policies created by the migration are present;
- a real authenticated assigned participant can join the private session topic;
- an authenticated same-alliance user who is not assigned and is not an event manager cannot join the private session topic;
- an unauthenticated client cannot join the private session topic.

The implementation branch does not change those dashboard settings.

## Durable acknowledgement model

`castle_command_session_acknowledgements` is keyed by session + player account and is foreign-keyed to an existing session assignment.

State transitions are server-owned:

`waiting → ready → sent`

Rules:

- absence of a row is equivalent to waiting;
- READY can be set by the authenticated user who owns the assigned Player Account;
- SENT requires an existing READY state;
- SENT is permitted only while the session is active;
- SENT cannot be moved backwards by the participant;
- an authorised event manager may reset an acknowledgement to waiting;
- acknowledgement rows disappear automatically if the underlying assignment is removed;
- a material change to the assignment snapshot automatically invalidates any existing READY/SENT acknowledgement so the player must reconfirm the revised rally call.

Material assignment changes include target, Howler use/level, snapshotted march duration, timing source, calibration state and source-profile snapshot timestamp.

## Session lifecycle authority

The live lifecycle is monotonic:

`planning → active → closed`

A planning session may also be closed without going active.

Closed sessions cannot be reopened.

001C revokes direct authenticated UPDATE and DELETE grants on `castle_command_sessions`. Live lifecycle changes occur through the manager-authorised RPC boundary. Session creation remains controlled by the existing manager-only INSERT RLS contract from 001B.

## Server clock and countdown integrity

The browser must not assume its local clock exactly matches the server or the other participants.

When the Live Room starts, Forge requests a fresh server timestamp and estimates browser-to-server clock offset using the midpoint of the request round trip.

Countdowns use:

`estimated server now = browser now + calibrated offset`

The client recalibrates periodically while connected and on successful Realtime subscription.

If the private channel is disconnected, or the server-clock sample becomes stale, the UI continues to show the last calibrated countdown but displays a prominent stale-sync warning telling the player to verify against the in-game clock.

## Launch countdown semantics

The immutable 001B assignment snapshot remains the timing source.

For each assignment:

`rally start = impact time - rally preparation - snapshotted observed march time`

The Live Room shows:

- countdown while more than five seconds remain;
- `START NOW` from five seconds before through five seconds after the rally-start timestamp;
- `LATE m:ss` after that launch window.

READY/SENT acknowledgement does not rewrite the calculated timing.

## Cost and performance controls

001C intentionally avoids high-volume realtime behaviour:

- one private channel per open Live Room;
- Presence tracked on join with a minimal advisory payload, not as a heartbeat table write;
- no trusted identity or role information in client-authored Presence payloads;
- no database presence table;
- no cursor/activity telemetry;
- server-clock RPC recalibration every two minutes while live;
- metadata-only Broadcast messages;
- canonical reload only when database state changes;
- no Postgres Changes subscription for Castle Command tables.

## Activation dependency

001C depends on the 001A and 001B Castle Command foundations.

The 001C migration must not be applied independently before the 001B profile/session migrations are approved and applied.

## Explicitly deferred

The following remain outside 001C:

- multi-wave rally planning;
- counter-rally impact offsets;
- spoken/audio launch cues;
- Discord command briefing generation;
- deputy-specific role model beyond existing Forge alliance event-manager authority;
- automatic detection that a player's city position changed;
- historical battle analytics and performance scoring.

## Acceptance expectations

Before merge/activation, verify:

- 001A and 001B accepted foundations remain green;
- TypeScript build and lint pass;
- Live Room domain tests pass;
- migration static contract tests pass;
- no Castle Command tables are added to `supabase_realtime` Postgres Changes publication;
- client channel configuration uses `private: true`;
- client code does not publish Broadcast commands;
- Presence is not used as an authoritative source for player identity or manager role;
- unassigned users cannot enter the private Live Room;
- assigned participants can receive Presence counts and state notifications;
- READY persists across refresh/reconnect;
- SENT requires READY and active session state;
- manager reset returns participant to waiting;
- a material assignment change invalidates existing READY/SENT acknowledgement;
- closed sessions cannot reopen;
- stale network/server-clock state is visibly disclosed;
- two authenticated browsers receive state changes without manual refresh;
- production activation is not claimed until the exact migration and Realtime settings have been owner-approved and smoke-tested.
