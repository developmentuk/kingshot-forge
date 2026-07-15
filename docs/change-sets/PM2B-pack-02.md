# PM2B Pack 02 — Review and Approval Workflow

## Scope

This pack adds the editorial review lifecycle on top of the immutable draft foundation.

## Added

- Submit for review
- Return to draft
- Reject
- Approve
- Legal transition validation
- Optimistic concurrency on transitions
- Immutable versions for every state change
- Audit events for every state change

## Verification

Run:

```powershell
npm run build
npm run lint
```

## Commit

```powershell
git add .
git commit -m "PM2B Pack 02 add review and approval workflow"
git push
```

Do not merge the PM2B branch into `develop` until the complete Editorial Workflow milestone is finished.
