# PM2B Pack 10A1 — Authenticated Editorial Runtime

## Scope

This pack connects the PM2B platform services to authenticated Vercel API endpoints.

## Added

- Bearer-token authentication through Supabase Auth
- Forge role resolution
- Server-side editorial permission enforcement
- Editorial record-state endpoint
- Draft and workflow action endpoint
- Publish queue actions
- Scheduled publishing actions
- Queue processing action
- Consistent HTTP error mapping
- Supabase-backed runtime service composition

## Endpoints

### GET `/api/editorial/record`

Query parameters:

- `datasetId`
- `recordId`

Returns:

- current head
- current version
- history
- queue items
- schedules

### POST `/api/editorial/action`

Supported actions:

- `save_draft`
- `submit_for_review`
- `return_to_draft`
- `approve`
- `reject`
- `queue_publish`
- `archive`
- `restore`
- `rollback`
- `schedule_publish`
- `retry_queue`
- `cancel_queue`
- `cancel_schedule`
- `process_queue`

## Security

All requests require a valid Supabase access token.

Mutations are executed with the server-side Supabase client, but permission decisions are made using the authenticated user's Forge role before any mutation is attempted.

## Next Pack

Pack 10A2 will connect the Record Editor and editorial admin workspace to these endpoints.
