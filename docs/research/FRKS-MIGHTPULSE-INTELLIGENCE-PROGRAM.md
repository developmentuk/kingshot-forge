# FRKS — MIGHTPULSE Intelligence Programme

- **Programme:** MIGHTPULSE-INTEL
- **Parent issue:** #109
- **Approved direction:** 30 August 2026
- **Provider:** MightPulse
- **Runtime base URL:** `https://api.mightpulse.com/v1`
- **Status:** Active architecture authority for MIGHTPULSE-001B through 001F
- **Supersedes:** the “historical, no implementation authority” posture of `FRKS-PLAYER-INTEL-001.md` for the specific approved MightPulse implementation only

## Decision

Forge will use MightPulse as a governed intelligence source for linked Player data,
Alliance roster intelligence, Kingdom intelligence, Transfer intelligence and a
gated KvK Intelligence Command Centre.

This approval does **not** change the separation between:

1. **linking** — a Forge user deliberately associates a Kingshot Player ID;
2. **observation** — Forge receives game data from MightPulse at a recorded time;
3. **ownership proof** — stronger evidence that the person controls the game account;
4. **Forge authority** — permissions derived from Forge membership/capability rules.

MightPulse observations never upgrade ownership or Forge authority by themselves.

## Provider contract

Shared provider key limits:

- 60 requests/minute;
- 5,000 requests/day;
- Player/Alliance sections may be up to 60 minutes old;
- stale requested sections may wait up to 90 seconds for provider refresh;
- concurrent provider requests for the same subject may share a provider refresh.

Forge must remain cache-first, quota-aware and explicit about freshness.

## Data classes

### A — public/opt-in presentation

Eligible only through existing Forge visibility policies and allowlisted
projections:

- name/avatar/Kingdom;
- Town Center;
- power;
- VIP;
- kills;
- language;
- Alliance summary;
- selected Kingdom rank information.

Provider availability does not itself make a field public.

### B — linked-player private intelligence

Owner-accessible:

- full safe base snapshot;
- Arena defence team;
- hero levels/stars/power/skills;
- equipped hero gear;
- exclusive/widget gear;
- Governor Gear;
- ranking detail;
- provider freshness/provenance.

Arena defence data must never be described as the player’s complete Hero
Collection.

### C — own-Alliance operational intelligence

Available to current authenticated members of the canonical Forge Alliance:

- Alliance roster;
- power / Town Center / kills / Alliance rank;
- avatar;
- online;
- last-active;
- on-demand deep-scout fields: x/y, last-login, shield end and burn end.

These fields are not public and must not be exposed by global Player search.

### D — active-KvK opponent intelligence

Available only to current authenticated members of the Forge Alliance while a
governed KvK intelligence session is active for the selected opponent scope:

- opponent roster and ranking intelligence;
- selected/pinned target deep-scout data;
- x/y;
- online / last-active / last-login;
- shield / burn state;
- power / TC / ranks;
- Arena defence heroes and Governor Gear when explicitly requested.

Opponent operational intelligence leaves active use after the KvK window.
Longer-lived history must be aggregate/non-sensitive or separately approved.

## Quota model

Forge must not poll entire Kingdoms player-by-player.

Preferred request economics:

- Alliance info+roster: one request for a whole roster;
- Kingdom summary/board: one request per requested view;
- linked Player rich sync: combine `base,heroes,ranks,gov_gear` where useful;
- deep operational Player refresh: only on demand or for pinned targets.

A persistent server-side quota/freshness ledger must coordinate usage across
Vercel instances. In-memory throttles remain defence in depth only.

Normal Player linking/manual refresh capacity must always have a protected daily
reserve. During active KvK, nonessential refresh categories may be
deprioritised in favour of governed battle intelligence.

## Storage model

Forge will preserve source/provenance separately from user-authored state.

Provider observations should be:

- server-created;
- source-attributed;
- freshness-stamped;
- fingerprinted where practical;
- normalised through allowlisted contracts;
- immutable or superseded rather than silently rewritten.

Latest read models may point to the newest accepted observation, but user-owned
fields such as biography, play style, transfer notes, manual Hero ownership,
showcase choices and other editorial fields are not silently overwritten.

Raw provider payloads are not browser contracts and should not be logged.

## Authority model

MightPulse R1–R5 / Alliance rank is informational evidence only.

Forge authority continues to use canonical Alliance Membership and scoped
capabilities. Current Forge Alliance members may read own-Alliance operational
intelligence. Quota-heavy refresh, target management and session management may
be capability-gated independently.

## KvK Intelligence operating model

The KvK tool uses a governed intelligence session with:

- own Forge Alliance;
- opponent Kingdom;
- optional tracked opponent Alliances;
- start/end window;
- status;
- target/watchlist;
- freshness and quota state.

All current Alliance members may read the active opponent intelligence view.
Management and refresh actions are separately capability/rate limited.

The tool must show last-known data when refresh is unavailable and label the
age honestly. It must not infer march time from map coordinates unless a
separate verified game rule supports that calculation.

## Workstreams

- #110 — MIGHTPULSE-001B Player Intelligence Foundation
- #111 — MIGHTPULSE-001C Alliance Intelligence & Roster Sync
- #112 — MIGHTPULSE-001D Kingdom Intelligence & Leaderboards
- #113 — MIGHTPULSE-001E Transfer Intelligence
- #114 — MIGHTPULSE-001F KvK Intelligence Command Centre

## Release governance

AEGIS remains mandatory.

Migration files may be authored, reviewed and validated in Git but production
schema changes remain explicitly owner-approved. Merges and production
activation remain owner-controlled.

Significant verified provider contracts, field mappings, quota observations and
acceptance results must be preserved back into FRKS.
