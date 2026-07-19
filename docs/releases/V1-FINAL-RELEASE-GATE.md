# Kingshot Forge — Version 1.0 Final Release Gate

Date: 19 July 2026  
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting HEAD: `e211993b76e8ca498952569f04cd3c740da7ba9c`  
Final HEAD: `2308509` (`docs(release): record final v1 gate`)  
Commits: `2308509`  
Supabase project: `hrvdhjscwitqpwjhnjkm`  
Replacement deployment: `dpl_6n8fUzHAJ3sGUTdyQf6mESxXrw6j`  
Preview: https://kingshot-forge-n2ywu430a-clarksim-7474s-projects.vercel.app

## Recommendation

**Not Ready for Version 1.0.** The code and automated validation gates pass, but the required approved User A/User B/editorial/admin sessions, authenticated responsive viewport acceptance, and owner operational evidence were not available. No production promotion, merge, tag or push was performed.

## Dependency audit

`npm audit` before and after the compatible lockfile refresh reported **10 findings: 6 high, 4 moderate, 0 critical**. The safe refresh moved `@vercel/node` 5.8.24 → 5.8.26 and `@vercel/build-utils` 13.33.0 → 13.34.0; the audit disposition did not change.

All findings are below `@vercel/node` in development/build tooling: `@vercel/build-utils`, `@vercel/python-analysis`, `@vercel/static-config`, `ajv`, `js-yaml`, `minimatch`, `path-to-regexp`, `smol-toml` and `undici`. They do not enter the browser bundle, and this repository contains no Vercel Function implementation using the affected runtime paths. The available complete fix requires the breaking direct downgrade to `@vercel/node@4.0.0`; it was not applied blindly. Classification: **Development-Only / Not Runtime-Reachable / Accepted Version 1.0 Risk**, pending a separately tested major-version dependency review.

## Acceptance evidence

- User A/User B isolation, persistence, stale-cache switching, direct-row mutation/read rejection, injection rejection and runtime RLS: **Not run**; approved identities unavailable.
- Static favourite contract and RLS checks: **Pass**. Policies are authenticated owner-only SELECT/INSERT/DELETE; no UPDATE grant/policy exists. Direct Supabase count: 0 rows, 0 labelled rows.
- Ordinary/editorial/admin permission acceptance and publication/rollback/republish/audit sequence: **Not run**; approved role identities unavailable. Existing in-memory editorial/API, publication and security tests pass.
- Exact replacement preview owner session: **Pass** for sign-in/application access and Global Search. The dialog parent is `BODY`, computed position is `fixed`, body overflow is locked while open, the searchbox receives focus, Escape removes the dialog, restores body overflow and returns focus to `Open global search`. Console diagnostics were clean.
- Responsive acceptance at 390px, 768px and 1280px: **Not run**; authenticated viewport tooling/sessions unavailable.
- Fixture totals: no fixtures created by this gate; Supabase `favourites` total 0 and labelled residue 0.

## Operational evidence

Supabase project status is `ACTIVE_HEALTHY` on PostgreSQL 17.6.1, and migration inventory is present. Backup status, restore rehearsal, migration rollback rehearsal, Vercel rollback rehearsal, named monitoring/incident owner, alert recipients and post-release monitoring window were not available in connected tools. These are owner-action blockers, not inferred as complete.

## Validation

- `npm run check` — pass; eight pre-existing lint warnings and the accepted Vite large-chunk warning remain.
- `npx tsc -p tsconfig.server.ts --noEmit` — pass.
- `npm run validate:nodenext` — pass.
- Focused search, favourites, editorial, publication, security and project checks — pass within `npm run check`.
- Production-equivalent build — pass.
- `git diff --check` — pass.

## Owner action required

Provide approved User A, User B, editorial and admin/publisher sessions plus responsive viewport tooling, then complete the runtime acceptance matrix and supply backup/restore, rollback, monitoring and incident-response evidence. Separately upgrade Supabase and enable leaked-password protection after the paid-plan move. Re-run this gate before production approval.
