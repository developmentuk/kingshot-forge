# PM2B Pack 06 — Publish Queue

## Scope

This pack introduces a reusable operational queue for publication requests.

Editorial record status remains authoritative. Queue status represents the operational execution of a publication request.

## Added

- Publication queue contracts
- In-memory queue repository
- Queue service
- Duplicate active-version protection
- Pending, processing, completed, failed and cancelled states
- Configurable retry limit
- Explicit retry and cancellation operations
- Publication executor boundary
- Editorial workflow executor adapter
- Queue filtering

## Processing Model

A queue item stores the approved version and the expected editorial head version.

When processed, the executor calls the editorial publication transition using optimistic concurrency.

A stale queue item therefore fails rather than publishing a different version than the one originally approved.

## Failure Behaviour

Executor failures are captured on the queue item.

Failed items may be retried until the configured maximum-attempt count is reached.

The service does not silently retry or discard failed publication requests.

## Scheduling

This pack does not schedule future execution. Pack 07 will add scheduled publishing on top of this queue.

## Verification

Run:

```powershell
npm run build
npm run lint
```

## Commit

```text
feat: add editorial publication queue
```
