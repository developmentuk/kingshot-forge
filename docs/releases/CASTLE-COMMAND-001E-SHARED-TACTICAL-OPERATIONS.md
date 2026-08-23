# CASTLE-COMMAND-001E — Shared Tactical Operations

Status: implementation complete on isolated stacked branch; activation pending owner review.

Parent: CASTLE-COMMAND-001D exact head `3610c375ba846e2c772156809cb3c4e40e202230`.

## Objective

Turn the browser-local 001D tactical draft into a shared, versioned battle-plan surface without weakening the 001C private-Realtime or 001D deputy authority boundaries.

## Delivered

- one canonical tactical plan pointer per Castle Command session
- immutable tactical plan versions
- optimistic `expected_version` saves so concurrent commanders cannot silently overwrite each other
- commander/deputy shared-plan publication
- participant read-only following of the current canonical plan
- immutable assignment snapshots per published version
- frozen session impact time and rally-preparation duration per published version
- assignment-drift warning when the current roster no longer matches the shared snapshot
- Realtime propagation over the existing private Castle Command channel
- no additional Presence channel or client-authored Broadcast path
- tactical version history with restore-as-new-draft behaviour
- coordination summary for assigned / READY / SENT / unconfirmed / Howler / plan-version counts
- closed-session history remains immutable
- privacy-safe RPC projections; `saved_by` and `updated_by` are not client-readable

## Authority

Shared tactical reads require `can_participate_castle_command_session(session_id)`.

Shared tactical saves require `can_manage_castle_command_session(session_id)`, which means an existing alliance event manager or an explicitly appointed 001D session deputy.

A closed session cannot receive a new tactical version.

## Version integrity

Every publish creates a new `(session_id, version)` record. Versions are never updated or deleted by authenticated clients.

The save RPC locks the session/current-plan boundary and compares the caller's expected version with the current version. A mismatch raises SQLSTATE `40001` and the client preserves the unsaved draft until the commander explicitly loads the newer canonical version.

Each version freezes:

- tactical mode
- stagger duration
- counter anchor and offset
- wave identifiers, labels and offsets
- exact assignment snapshots including player/target/march/Howler timing fields
- session impact timestamp
- rally preparation duration
- save timestamp

## Realtime

`castle_command_tactical_plans` uses the existing metadata-only `broadcast_castle_command_state_change()` trigger. The browser receives only the entity/operation/session/time notification and re-fetches the canonical RPC projection.

No tactical payload is sent through Broadcast. No second Castle Command Presence subscription is created.

## Battle summary boundary

The summary is a coordination record only. Forge can report command-state facts it owns, such as assignments, READY/SENT state and tactical version count.

Forge does **not** claim to know:

- rally combat outcome
- structure ownership
- damage dealt
- whether a rally actually landed in game
- whether an operator-entered counter anchor matched the exact game-state transition

## Fallback

Until the 001E migration is activated, the 001D browser-local tactical editor remains available and is labelled `001E activation pending`. Shared publication/history/summary controls do not pretend to be active.

## Activation gate

Do not apply the 001E migrations until 001B, 001C and 001D are owner-approved and the private Castle Command Realtime boundary is verified with real authenticated assigned, deputy, manager, unassigned and unauthenticated clients.

No production schema/data or Realtime dashboard setting is changed by the implementation branch itself.
