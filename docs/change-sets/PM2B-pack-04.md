# PM2B Pack 04 — Version History and Diff Engine

## Scope

This pack adds reusable editorial history, comparison and rollback-preview services.

## Added

- Chronological version history
- Audit-event association
- History filtering by actor, status, action and date
- Version retrieval
- Recursive record comparison
- Added, removed and changed field detection
- Nested object and array paths
- Rollback preview without mutation
- Validation that compared versions belong to the same record

## Diff Behaviour

Objects are compared recursively by key.

Arrays are compared by index.

Changes are returned using paths such as:

```text
name
skills[2].level
source.confidence
```

Rollback preview compares the current version with the selected historical version. It does not perform the rollback.

## Verification

Run:

```powershell
npm run build
npm run lint
```

## Commit

```text
feat: add editorial version history and diff engine
```
