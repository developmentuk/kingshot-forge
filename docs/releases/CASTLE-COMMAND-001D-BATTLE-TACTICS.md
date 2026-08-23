# CASTLE-COMMAND-001D — Battle Tactics

Status: implementation branch; deputy activation gated

## Purpose

CASTLE-COMMAND-001D adds tactical planning on top of the validated 001A–001C Castle Command foundations without claiming that Forge can observe Kingshot battlefield ownership or infer a universal counter-rally offset.

## Scope

001D adds:

- simultaneous-impact planning;
- controlled per-player staggered impacts;
- up to five waves using the immutable 001B assignment snapshots;
- operator-anchored counter timing with configurable post-capture offset;
- a server-calibrated “Mark capture now” control;
- game-chat and Discord battle brief generation in UTC;
- local audio beep and spoken launch cues;
- personal-only cues for participants and optional all-call cues for commanders/deputies;
- automatic cue suppression when 001C server sync is stale;
- session-scoped deputy command authority;
- permanent 001D coverage in the existing Castle Command CI step.

## Research boundary

Current Kingshot community/planning tools support rally and counter queues, simultaneous or staggered impacts, impact-second control and multiple managers. Those patterns justify the product capability, but they do not establish one universally correct counter offset.

Forge therefore treats counter mode as an operator-entered observation:

`planned impact = observed enemy capture time + commander-selected offset`

Forge does not claim to detect ownership changes, predict the enemy capture instant or guarantee that any selected offset produces a particular in-game combat result.

## Tactical modes

### Simultaneous

Every assigned player in a wave receives the same impact timestamp. Their rally-start time differs according to their immutable observed march snapshot.

### Staggered

Assigned players are ordered deterministically by longest march first, then player name and assignment ID. Each successive player receives:

`impact = wave impact + player index × stagger seconds`

The commander selects the stagger from 0–30 seconds.

### Counter

The commander records an observed enemy capture timestamp, optionally using the 001C server-calibrated clock, and chooses a 0–60 second desired impact offset.

No automatic capture detection is present.

## Waves

A local tactical plan can contain one to five waves. Each wave has a label and a 0–300 second offset from the tactical anchor.

Waves reuse the session’s immutable assignment timing snapshots. 001D does not silently create new assignments, change a player target or recalculate Howler duration.

Tactical plans are stored only in that browser’s local storage in 001D. This deliberately avoids creating a second authoritative battle-plan dataset while the earlier Castle Command database migrations remain review-gated.

## Brief generation

The game brief is compact plain text showing wave, UTC start time, player, target and observed march duration.

The Discord brief is richer Markdown showing UTC start and impact times, wave offsets, target, march duration and Howler snapshot where applicable.

Counter briefs explicitly disclose that capture anchors and offsets are commander-entered observations.

## Audio and spoken cues

Cues are browser-local only and never authoritative.

- participants can cue only their own tactical calls;
- commanders and deputies can optionally cue all calls;
- each call is announced at most once per locally loaded plan;
- cues pause whenever 001C reports stale server synchronization;
- a test-cue control allows the user to verify browser audio/speech support.

## Session deputy authority

001D adds `castle_command_session_deputies` as review-gated server state.

A deputy:

- must already be assigned to that exact session;
- may start or close the live session;
- may reset participant READY/SENT acknowledgements;
- may use commander-level all-call tactical cues;
- receives private Live Room access through the existing 001C authorization path.

A deputy may not:

- appoint or remove other deputies;
- gain alliance admin capabilities;
- edit alliance membership;
- gain 001B assignment/roster mutation authority merely by being a deputy.

Only the pre-existing Castle Command/alliance event-management authority can appoint or remove deputies.

## Realtime

Deputy insert/delete changes use the existing metadata-only private `state_changed` Broadcast trigger. Clients re-check session authority from the database after the notification.

001D does not add Postgres Changes subscriptions and does not allow client-authored Castle Command Broadcast commands.

## Activation gate

The 001D migration must not be applied before the 001B and 001C migrations are owner-approved and activated.

Before activation verify with real authenticated users that:

- an alliance event manager can appoint an assigned participant as deputy;
- an ordinary participant cannot appoint a deputy;
- a deputy can use live lifecycle/reset RPCs;
- a deputy cannot mutate the 001B roster solely through deputy status;
- removal of an assignment cascades the deputy record;
- removal of deputy authority is observed without relying on client Presence claims.

## Acceptance expectations

Before merge/activation:

- 001A–001C tests remain green;
- 001D tactical domain tests pass;
- simultaneous, staggered, wave and counter calculations are deterministic;
- counter mode requires an explicit observed anchor;
- no early `START NOW` behaviour is reintroduced;
- game and Discord brief generation is tested;
- client audio cues stop when server sync is stale;
- deputy direct table writes are not granted to authenticated clients;
- only existing alliance event managers can appoint deputies;
- lint and production TypeScript/Vite build pass;
- no 001B/001C/001D migration is applied as part of implementation review.
