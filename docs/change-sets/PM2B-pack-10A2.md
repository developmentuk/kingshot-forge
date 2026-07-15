# PM2B Pack 10A2 — Record Editor Runtime Connection

## Scope

This pack connects the existing Record Editor and editorial admin workspace to the authenticated PM2B runtime APIs.

## Added

- Authenticated editorial API client
- Connected Record Editor wrapper
- Server-backed draft saving
- Current editorial state loading
- Workflow action wiring
- Version history display
- Client-side version comparison
- Rollback confirmation and execution
- Publish queue creation
- Queue retry and cancellation
- Schedule cancellation
- Runtime error states
- Existing dataset editor integration

## Behaviour

The first save creates an editorial draft.

Subsequent saves use optimistic concurrency based on the current editorial head version.

The Publish action creates a publication queue item. Queue processing remains an explicit server operation.

Historical rollback creates a new immutable version; it does not overwrite an old version.

## Verification

Run:

```powershell
npm run check
```

After deployment, open an editable dataset record and verify that saving creates the first editorial draft.
