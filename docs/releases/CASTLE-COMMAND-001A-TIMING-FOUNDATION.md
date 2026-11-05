# CASTLE-COMMAND-001A — Castle Command Timing Foundation

Status: implementation branch

## Purpose

Forge Castle Command is a login-only Kingshot operations tool for coordinating Castle Battle rally timing. The foundation binds timing data to the signed-in user's linked Player Passport and provides exact observed march-time scheduling for the Castle and all four turrets.

## Foundation scope

CASTLE-COMMAND-001A provides:

- a private My Forge surface for signed-in users;
- linked Player Passport identity rather than repeated manual Player Name / Player ID entry;
- five player-observed march-time slots: Castle, North Turret, East Turret, South Turret and West Turret;
- separate normal and observed Grizzly Bear / The Howler times for every target;
- governed Howler skill metadata loaded from the canonical Forge pets dataset;
- Howler skill levels 1–8 as published by that dataset;
- a strict no-guessing rule for effective Howler travel time;
- 1, 3 and 5 minute rally preparation options;
- target-impact scheduling down to the second;
- calculation of rally start, march departure and intended impact times;
- mobile-responsive presentation;
- player-scoped browser persistence for this foundation slice.

## Timing rule

For a chosen target:

`rally start = target impact - rally preparation - observed march time`

`march departure = target impact - observed march time`

The calculation uses the player's observed in-game march duration.

## Pet integrity rule

The governed pets dataset records The Howler as a March Speed modifier. Castle Command MUST NOT convert the advertised March Speed percentage directly into an assumed travel-time reduction.

When Howler is active:

1. use the player's observed Howler march time for the selected target when present;
2. otherwise fall back visibly to the normal observed march time;
3. mark that target as needing Howler calibration;
4. never silently estimate an exact buffed duration from the advertised percentage.

This preserves battle-timing integrity if Kingshot combines march-speed modifiers in a non-linear or additive movement formula.

## Identity and access

The tool consumes the existing authenticated Forge user and primary linked `player_accounts` identity through the Player Identity context.

Unauthenticated visitors may see only the sign-in boundary and cannot use the timing surface. Signed-in users without a linked Player Passport are directed to link their Kingshot player first.

## Persistence boundary

001A stores the five personal observed timings in browser storage under the linked Kingshot Player ID. This makes the first slice usable without introducing a new database contract before the collaborative session model is agreed.

Cloud persistence and Supabase RLS belong to the next persistence/collaboration slice and must preserve player ownership and least-privilege access.

## Explicitly deferred

The following are not part of 001A and must not be smuggled into this foundation:

- shared alliance battle sessions;
- commander/deputy permissions;
- realtime participant synchronisation;
- READY / SENT acknowledgements;
- multi-wave scheduling;
- counter-rally offsets;
- audio or spoken launch cues;
- Discord briefing generation;
- cross-device march-profile persistence;
- automatic stale-position detection.

These belong to the collaborative Castle Command milestone after the personal timing foundation is accepted.

## Validation expectations

The feature should be accepted only after:

- duration parsing and formatting tests pass;
- normal/Howler fallback behaviour is covered;
- exact rally-start arithmetic is covered;
- the canonical pets dataset resolves Grizzly Bear / The Howler progression correctly;
- TypeScript build passes;
- lint passes;
- authenticated and unlinked-player states are manually or automatically verified;
- the route is reachable from My Forge but does not expose the functional surface to signed-out users.
