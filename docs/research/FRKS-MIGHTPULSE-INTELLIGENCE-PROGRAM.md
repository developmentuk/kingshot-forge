# FRKS — MIGHTPULSE Intelligence Programme

- **Programme:** MIGHTPULSE-INTEL
- **Parent issue:** #109
- **Approved direction:** 30 August 2026
- **Provider:** MightPulse
- **Runtime base URL:** `https://api.mightpulse.com/v1`
- **Status:** Active architecture authority; MIGHTPULSE-001B closed in production, MIGHTPULSE-001C active foundation
- **Supersedes:** the “historical, no implementation authority” posture of `FRKS-PLAYER-INTEL-001.md` for the specific approved MightPulse implementation only

## Decision

Forge will use MightPulse as a governed intelligence source for linked Player data,
Alliance roster intelligence, Kingdom intelligence, Transfer intelligence and a
gated KvK Intelligence Command Centre.

This approval does **not** change the separation between:

1. **linking** — a Forge user deliberately associates a Kingshot Player ID;
2. **observation** — Forge receives game data from MightPulse at a recorded time;
3. **ownership proof** — stronger evidence that the person controls the game account;
4. **Forge Alliance authority** — Alliance membership/rank may be synchronised from
   the latest successful MightPulse observation;
5. **Forge global authority** — platform-wide roles such as admin/owner remain
   independent and are never granted by MightPulse.

MightPulse observations never upgrade player ownership/verification or Forge
global roles. They **may** create/update the player's canonical Forge Alliance
membership and in-Alliance position when the provider reports a current Alliance
and rank.

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

## Authentication-triggered refresh

Every genuine authenticated sign-in for a linked Forge player triggers one
server-side MightPulse Player refresh. This refresh is session-triggered rather
than page-triggered and updates approved provider-owned fields automatically,
including current Alliance membership/rank.

Duplicate auth callbacks, multiple mounted routes or rapid reloads must not
amplify this into repeated provider calls: Forge uses per-user/session
single-flight coordination plus a short safety cooldown. After the sign-in
refresh, an active session may refresh again around the provider's ~60-minute
freshness boundary, on an explicit manual refresh, or when a governed feature
requires fresher data.

Login refresh is a high-priority quota class. If the provider is unavailable or
quota-limited, authentication itself still succeeds and Forge uses the last
successful cached observation with a visible freshness state.

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

The latest successful MightPulse Alliance observation is authoritative for the
player's **in-game Alliance membership and position inside Forge**.

Canonical mapping:

- R1 → `member`
- R2 → `recruiter`
- R3 → `officer`
- R4 → `r4`
- R5 → `leader`

A successful refresh may therefore create/update the canonical Alliance
Membership and synchronise its `member_role`. R4/R5 may receive the
corresponding Alliance-management position/capability profile. This authority is
resource-scoped to that exact Alliance and never grants Forge-wide
`admin`/`owner` privileges.

If a newer successful MightPulse observation shows a rank change, Alliance
change, or no Alliance, Forge synchronises the membership/position accordingly.
A provider outage does not by itself revoke the last successfully confirmed
Alliance position; failed refreshes preserve the last-known state and freshness
metadata. Emergency/manual Forge suspension remains available for abuse or
incident response.

Current Alliance members may read own-Alliance operational intelligence.
Quota-heavy refresh, target management and KvK session management may still be
capability-gated independently.

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

- #110 — MIGHTPULSE-001B Player Intelligence Foundation — **closed / production accepted 31 August 2026**
- #111 — MIGHTPULSE-001C Alliance Intelligence & Roster Sync — **active foundation**
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


## MIGHTPULSE-001B production closure — 31 August 2026

MIGHTPULSE-001B completed its owner-controlled production acceptance at main
`ab0140ce755e78714b541d2b50fcfe282a86a73d`, deployed as
`dpl_5XTaZRBpXo7QimMeb4szk9uSRzaW` with production state `READY`.

At closure, provider quota governance and Player Intelligence are both enabled.
The final controlled genuine sign-in recorded one `player_sign_in` reservation,
one provider attempt, one sign-in Player Intelligence observation and one
Alliance provider-state update, with no authority-override mutation. The
sign-in acceptance therefore satisfies the one-genuine-login / one-provider-
request requirement introduced by PR #121.

The production implementation preserves the programme authority model:
MightPulse may synchronise current in-game Alliance membership/rank and
Alliance-scoped R4/R5 management authority, but it never grants Forge-global
admin/owner and never upgrades Player ownership/verification.

Issue #110 is closed as completed.

## MIGHTPULSE-001C foundation handoff

MIGHTPULSE-001C begins from the exact accepted production baseline
`ab0140ce755e78714b541d2b50fcfe282a86a73d` on
`feature/mightpulse-001c-alliance-intelligence`.

001C must build on the existing 001B provider/quota/freshness/authority
foundation rather than create a parallel Alliance source of truth.

A Gate-0 identity-contract reconciliation is mandatory before implementation:
the current 001B production path canonicalises provider Alliance tags to
uppercase before lookup/state storage, while issue #111 still describes an
exact case-sensitive tag binding. 001C must preserve one canonical Alliance
identity and must not create duplicate logical Alliances from tag case
variants. Any deliberate change to the canonicalisation contract requires a
separate explicit owner decision.

No merge, migration application, deployment or runtime change is authorised by
this handoff.
