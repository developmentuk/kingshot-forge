# PM2B Pack 09 — Supabase Persistence

## Scope

This pack adds production persistence implementations for the editorial platform, publication queue and scheduled publishing.

## Added

- Editorial record-head table
- Immutable editorial version table
- Append-only editorial audit table
- Publication queue table
- Scheduled publication table
- Atomic editorial commit database function
- Optimistic concurrency inside the database transaction
- Active-version uniqueness constraints
- Supabase editorial repository
- Supabase publication queue repository
- Supabase scheduling repository
- Persistence barrel exports
- Read-only authenticated RLS policies

## Security Model

Repository mutations are designed for server-side use with the Supabase service-role client.

The service-role key must never be exposed through Vite environment variables or browser bundles.

Authenticated browser users receive read access only through the policies supplied here. Server APIs remain responsible for role enforcement and privileged mutations.

## Atomic Editorial Commit

`commit_editorial_version` performs these operations in one transaction:

1. lock the current record head;
2. verify the expected version;
3. insert the immutable version;
4. update the current head;
5. insert the audit event.

A concurrency conflict causes the entire transaction to fail.

## Database Installation

Run the migration through the Supabase SQL Editor or Supabase migration tooling:

```text
supabase/migrations/20260715210000_pm2b_editorial_persistence.sql
```

## Verification

Run:

```powershell
npm run build
npm run lint
```

## Commit

```text
feat: add Supabase editorial persistence
```
