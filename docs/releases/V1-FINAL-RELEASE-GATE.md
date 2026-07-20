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

## UX-002 remediation

The focused UX-002 blocker remediation is recorded in
[`UX-002-V1-RELEASE-BLOCKER-REMEDIATION.md`](UX-002-V1-RELEASE-BLOCKER-REMEDIATION.md).
Its local changes still require a clean exact-commit preview, responsive
screenshots and authenticated owner review before this gate can be marked Ready.

UX-002 final documentation commit `e7dc083` deployed READY to
`https://kingshot-forge-ahzw0qw8f-clarksim-7474s-projects.vercel.app` as
`dpl_JBEoW5XHHnHnyLXVmaSQkwcoiVdR`. Owner review remains pending.

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
## UX-001 local hardening follow-up

The local UX-001 implementation is documented in
[`UX-001-V1-EXPERIENCE-HARDENING.md`](UX-001-V1-EXPERIENCE-HARDENING.md).
It adds focused Global Search containment/API safeguards, canonical preview/
production labels and shared UI tokens. This gate remains **Not Ready** until
the exact clean commit is deployed to protected preview and owner-authenticated
responsive, cross-role and operational evidence is completed.

## UX-001 preview deployment update — 19 July 2026

The exact replacement commit `1a2f9d55a3ec1a1b233cec7448672cfc453192c6`
is deployed READY as `dpl_7iMvfxJd7ZVkqbqr5duAq9te9Ae9` at
https://kingshot-forge-qhho6ce8q-clarksim-7474s-projects.vercel.app.
Protected preview runtime checks pass for Global Search, version presentation,
representative public/player/admin routes, requested responsive widths and
console errors. Owner visual decision remains **Pending owner confirmation**;
this gate is not promoted to Ready.

## Exact UX-001 commit deployment continuation — 19 July 2026

The exact requested commit `5e277720d94aaa38a852e6ce996625c7debd2362` was
deployed cleanly as protected preview `dpl_6QAuc5AvHLVBrzwfzZnHkYePG8B8`
at `https://kingshot-forge-qw27incbg-clarksim-7474s-projects.vercel.app`.
Status is `READY`; target is `preview`; Vercel project is `kingshot-forge`
(`prj_qoxc7FGYaVFAwtREvHpB5viQguO7`) and the configured preview Supabase
bindings are present for project `hrvdhjscwitqpwjhnjkm`. No promotion,
merge, tag or push occurred.

The exact-commit checks passed: `npm run check`, server TypeScript,
`npm run validate:nodenext`, `npm run build` and `git diff --check`. Existing
non-blocking warnings are eight Oxlint warnings, the Vite large-client-chunk
warning, ten npm audit findings (six high/four moderate) and the Node
`url.parse` deprecation warning in runtime logs.

Deployed Global Search, preview release label, representative route and
responsive checks passed. Console diagnostics were empty. Vercel runtime
logs recorded HTTP 200 for `/api/search` and dataset reads; no failed route
chunk or stylesheet was observed. Protected admin/editorial/operations routes
were inspected as unauthenticated access-denied/workspace-unavailable states,
not treated as authenticated owner acceptance.

Owner visual decision remains **Pending owner confirmation**. Recommendation
remains **Not Ready for Version 1.0** until the owner inspects the exact
protected preview and supplies the UX-001 decision, authenticated role
evidence and outstanding operational recovery evidence.
## UX-003 gate note

UX-003 is not accepted by automated checks alone. The owner must review the replacement preview for canonical Search destinations, automatic linked-player identity/Town Center refresh, progression enablement/save, role mutations and audit history, Render Engine workflow, five responsive Hero Companion widths, structured Forge Connections and KvK versus cards. See `docs/releases/UX-003-V1-FUNCTIONAL-ACCEPTANCE-REMEDIATION.md`.
## UX-004 gate note

UX-004 implementation is complete locally and is not a production promotion. The exact clean commit still requires a new protected preview, migration application, authenticated acceptance evidence, and zero-fixture verification before Version 1.0 readiness can be claimed.
