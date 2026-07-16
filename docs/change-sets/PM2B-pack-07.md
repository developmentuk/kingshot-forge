# PM2B Pack 07 — Scheduled Publishing

## Scope

This pack adds future publication scheduling on top of the Pack 06 publication queue.

## Added

- Scheduled publication contracts
- In-memory scheduling repository
- Scheduling service
- Future-time validation
- Duplicate active-version protection
- Due-schedule discovery
- Queue handoff
- Cancellation
- Failure capture
- Structured run results

## Execution Model

A scheduled publication stores the exact approved version and expected editorial version that should be published.

When the schedule becomes due, it is handed to the existing publication queue.

The queue remains responsible for processing, retries and publication execution.

## State Separation

Scheduling state:

```text
scheduled → queued
scheduled → cancelled
scheduled → failed
```

Queue state remains:

```text
pending → processing → completed
pending → processing → failed
failed → pending
pending/failed → cancelled
```

This separation prevents scheduling concerns from changing editorial record status.

## Runtime Integration

This pack supplies the scheduling engine only.

A future server or cron integration can call:

```ts
scheduledPublishingService.runDue()
```

## Verification

Run:

```powershell
npm run build
npm run lint
```

## Commit

```text
feat: add scheduled editorial publishing
```
