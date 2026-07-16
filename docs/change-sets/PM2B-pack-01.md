# PM2B Pack 01 — Editorial Draft Foundation

## Scope

This pack establishes the editorial lifecycle core without connecting the Record Editor or database.

## Added

- Editorial contracts
- Repository contract
- In-memory reference repository
- Draft service
- Optimistic concurrency
- Immutable version history
- Append-only audit events
- Architecture documentation

## Verification

Run:

```powershell
npm run build
npm run lint
```

## Commit

```powershell
git add .
git commit -m "PM2B Pack 01 add editorial draft foundation"
git push
```

Do not merge the PM2B branch into `develop` until the complete Editorial Workflow milestone is finished.
