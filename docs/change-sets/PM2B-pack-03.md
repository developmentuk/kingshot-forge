# PM2B Pack 03 — Publication Lifecycle

## Scope

This pack completes the core editorial publication lifecycle on top of the draft, review and approval foundations.

## Added

- Publish approved records
- Archive published records
- Restore archived records
- Roll back published or archived records to an older immutable version
- Legal transition validation
- Optimistic concurrency on all publication operations
- Immutable versions for every publication state change
- Rollback audit metadata identifying the source and target versions
- Public service exports for publication lifecycle operations and errors

## Lifecycle

```text
draft → in_review → approved → published → archived
                                  ↑          │
                                  └─ restore ┘
```

Rollback creates a new `published` version using the values from an older version. It never rewrites or deletes version history.

## Verification

Run:

```powershell
npm run build
npm run lint
```

## Commit

```powershell
git add .
git commit -m "PM2B Pack 03 add publication lifecycle"
git push
```

Do not merge the PM2B branch into `develop` until the complete Editorial Workflow milestone is finished.
