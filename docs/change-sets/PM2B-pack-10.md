# PM2B Pack 10 — End-to-End Validation and Release Readiness

## Scope

This pack adds repeatable structural validation and the final PM2B release gate.

## Added

- `npm run validate:pm2b`
- `npm run check`
- Required-file validation
- Migration-content validation
- Client-secret guard checks
- `erasableSyntaxOnly` compatibility check
- Supabase verification SQL
- End-to-end manual test checklist
- Updated milestone status

## Validation Commands

```powershell
npm run validate:pm2b
npm run lint
npm run build
```

Or run all three:

```powershell
npm run check
```

## Important Boundary

This pack validates architecture, source structure, database installation and release scenarios.

It does not claim the editorial workflow is production-ready until the manual end-to-end scenarios have been completed against a test record.

## Commit

```text
test: add PM2B release validation
```
